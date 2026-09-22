import { ipAddress } from '@vercel/functions';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { z } from 'zod';

// Configuración del cliente Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuración de Redis y Rate Limiter con validación
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.log('✅ [REDIS] Inicializando cliente Redis...');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  
  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(3, '10 m'), // 3 solicitudes cada 10 minutos
    analytics: true,
  });
  console.log('✅ [REDIS] Rate limiter configurado correctamente');
} else {
  console.error('❌ [REDIS] Variables de entorno de Upstash no configuradas');
}

// Esquema de validación con Zod
const signupRequestSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string().email('Debe proporcionar un email válido'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(1000, 'El mensaje no puede exceder 1000 caracteres'),
  website: z.string().optional(), // Campo honeypot
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [POST] Iniciando procesamiento de solicitud de beta...');
    
    // 1. Verificar si el rate limiter está disponible
    if (!ratelimit) {
      console.error('❌ [RATE_LIMITER] Rate limiter no disponible - variables de Upstash no configuradas');
      return NextResponse.json(
        { 
          error: 'Servicio temporalmente no disponible. Configuración de rate limiting pendiente.',
          details: 'Las variables de entorno UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN no están configuradas.'
        },
        { status: 503 }
      );
    }
    
    // 2. Rate Limiting por IP
    const ip = ipAddress(request) ?? '127.0.0.1';
    console.log(`🔍 [RATE_LIMITER] Verificando límites para IP: ${ip}`);
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      console.log(`⚠️ [RATE_LIMITER] Límite excedido para IP ${ip}. Límite: ${limit}, Restante: ${remaining}`);
      return NextResponse.json(
        { 
          error: 'Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.',
          details: `Límite: ${limit}, Restante: ${remaining}, Reset: ${new Date(reset).toLocaleString()}`
        },
        { status: 429 }
      );
    }
    
    console.log(`✅ [RATE_LIMITER] Rate limit OK para IP ${ip}. Restante: ${remaining}/${limit}`);

    // 3. Parsear y validar datos del cuerpo de la petición
    console.log('📝 [VALIDATION] Parseando datos del formulario...');
    const body = await request.json();
    console.log('📋 [VALIDATION] Datos recibidos:', { 
      name: body.name ? `✅ ${body.name.substring(0, 20)}...` : '❌ Vacío',
      email: body.email ? `✅ ${body.email}` : '❌ Vacío',
      message: body.message ? `✅ ${body.message.substring(0, 50)}...` : '❌ Vacío',
      website: body.website ? `⚠️ HONEYPOT: "${body.website}"` : '✅ Honeypot vacío'
    });
    
    const validationResult = signupRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.log('❌ [VALIDATION] Validación fallida:', validationResult.error.errors);
      return NextResponse.json(
        { 
          error: 'Datos de formulario inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }
    
    console.log('✅ [VALIDATION] Validación exitosa');
    const { name, email, message, website } = validationResult.data;

    // 4. Verificación del campo honeypot
    if (website && website.trim() !== '') {
      // Si el campo honeypot fue rellenado, es probable que sea un bot
      // Devolvemos éxito silenciosamente sin enviar el correo
      console.log(`🍯 [HONEYPOT] Bot detectado desde IP ${ip}. Campo honeypot rellenado: "${website}"`);
      return NextResponse.json({ success: true, message: 'Solicitud enviada correctamente.' });
    }
    
    console.log('✅ [HONEYPOT] Verificación anti-bot pasada');

    // 5. Verificar configuración de Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ [EMAIL] RESEND_API_KEY no configurada');
      return NextResponse.json(
        { error: 'Servicio de correo no disponible. Configuración pendiente.' },
        { status: 503 }
      );
    }

    // 6. Envío del correo usando Resend
    console.log('📧 [EMAIL] Preparando envío de correo...');
    const emailSubject = `Nueva solicitud de acceso a beta - ${name}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          Nueva Solicitud de Acceso a Beta
        </h2>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Información del Solicitante</h3>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #374151;">Mensaje</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;">
            <strong>Nota:</strong> Esta solicitud fue enviada desde el formulario de beta en sustrato.ai
          </p>
        </div>
      </div>
    `;

    console.log('📤 [EMAIL] Enviando correo a contacto@sustrato.ai...');
    const emailResult = await resend.emails.send({
      from: 'Sustrato.ai <noreply@sustrato.ai>',
      to: ['contacto@sustrato.ai'],
      replyTo: email,
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailResult.error) {
      console.error('❌ [EMAIL_ERROR] Error al enviar correo:', emailResult.error);
      return NextResponse.json(
        { error: 'Error al enviar el correo. Por favor, inténtalo de nuevo.' },
        { status: 500 }
      );
    }

    console.log(`✅ [SUCCESS] Solicitud de beta enviada correctamente desde ${ip} - Email ID: ${emailResult.data?.id}`);

    // 7. Respuesta de éxito
    return NextResponse.json({
      success: true,
      message: 'Solicitud enviada correctamente. Te contactaremos pronto.',
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error('[SIGNUP_REQUEST_ERROR]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
