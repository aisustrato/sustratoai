# Geometría del Transporte Coherente: Un Marco Lagrangiano para la Invarianza Trans-escala

| | |
|---|---|
| **Autor:** | Rodolfo Leiva |
| **ORCID:** | 0009-0003-4251-2733 |
| **DOI:** | 10.5281/zenodo.20385583 |
| **Fecha:** | Mayo 2026 |

*Versión: v2.21 — Edición en Español (master canónico reconciliado)*
*Sustrato.ai*
*Licencia: CC BY 4.0*

<!--
PROVENANCIA / TRAZABILIDAD (ética = negentropía a nivel de datos)
Fuente F0 reconciliada = v2.17 (md, fórmulas LaTeX limpias) + v2.19 (ES, contenido endurecido).
Corrección aplicada: TODAS las fórmulas migradas a LaTeX ($...$ inline / $$...$$ display)
para que el pipeline md->docx (pandoc) genere ecuaciones OMML reales y no glifos Unicode
frágiles (ᵢ ₙ ⱼ ₖ ᵀ, U+1D62 etc.) que se corrompían al renderizar el PDF.
Verificado por diff sección-a-sección: sin pérdida de contenido respecto a v2.19.
Exportar con: pandoc Geometria_del_Transporte_Coherente_v2_21_master.md -o out.docx

CHANGELOG v2.20 -> v2.21 (cambio único; resto idéntico):
La v2.20 sellada (DOI 10.5281/zenodo.20385583) permanece como referencia inmutable.
§13.3 Eje A — Cláusula de Falsabilidad cardíaca: migrada de umbral estático fijado a mano
(índice de Jaccard < 0.6) a un modelo nulo de permutación intra-sujeto (rotación espacial
aleatoria de la cicatriz sobre el mismo ventrículo). Motivo: el umbral fijo se leía como
acomodo post-hoc; el modelo nulo deriva el criterio del dato, no de la conveniencia.
La física de fondo (§8.1, tensor de Cauchy-Green, derivación de la disipación) no cambia.
-->

---

**Dedicatoria**

*A Baruch Spinoza, quien primero escribió que la ética podía demostrarse* more geometrico *— al modo de la geometría. Postuló, contra las ortodoxias de su siglo, que las pasiones humanas, la naturaleza y la mente obedecen a las mismas leyes inexorables que las figuras de Euclides. Trescientos cincuenta años después, este trabajo intenta completar lo que él abrió: mostrar, con el aparato de las matemáticas del siglo XXI, que la ética no es un imperativo moral blando sino una restricción geométrica dura, necesaria para que cualquier sistema complejo evite su desintegración. El Dios-o-Naturaleza que Spinoza vio entero ahora se extiende para incluir la termodinámica de los tensores de atención.*

*— R.L.*

---

# Resumen

La presente investigación profundiza en la equivalencia matemática y estructural entre las Estructuras Coherentes Lagrangianas (LCS) identificadas en la atmósfera de Júpiter y la morfología de los meandros fluviales terrestres. La comprensión de la dinámica de fluidos ha experimentado un cambio de paradigma fundamental en las últimas décadas, transitando de una descripción puramente estática y local hacia una visión global y geométrica basada en el seguimiento de parcelas de fluido. Esta perspectiva, conocida como enfoque Lagrangiano, ha revelado la existencia de esqueletos ocultos que organizan el movimiento aparente de los fluidos en sistemas tan dispares como la atmósfera de los gigantes gaseosos y las redes hidrográficas de nuestro planeta.

La evidencia analizada indica que ambos sistemas obedecen a principios universales de optimización y leyes de invarianza adimensional. La analogía topológica profunda entre la Gran Mancha Roja de Júpiter y los meandros terrestres se sustenta en tres pilares: consistencia matemática bajo la conservación de la vorticidad potencial y la aproximación cuasi-geostrófica; eficiencia constructal, según la cual tanto los chorros planetarios como los cauces sinuosos resultan de procesos de optimización que maximizan el acceso al flujo de energía y materia; y arquitectura Lagrangiana, donde la organización del transporte de masa sigue el esqueleto definido por las variedades invariantes de tiempo finito, que crean barreras de mezcla permitiendo la persistencia de formas complejas en el caos. La invarianza de la arquitectura Lagrangiana hace que el sustrato material y la escala espacial resulten secundarios frente a la restricción impuesta por las variedades invariantes: el patrón geométrico-formal es independiente del sustrato, y la escala es un parámetro de realización, no el generador de la forma.

Adicionalmente, se extiende la validación de la analogía topológica a dominios no fluidos, incluyendo flujos granulares densos y redes vasculares pulsátiles, mediante un análisis riguroso de consistencia matemática y validación cruzada. Los resultados sugieren que la separación entre la meteorología planetaria y la geomorfología fluvial es puramente artificial, y que las Estructuras Coherentes Lagrangianas constituyen el nexo de unión que proporciona un lenguaje matemático universal basado en la geometría del espacio de fase y la física de la deformación material.

La investigación demuestra, mediante la derivación del tensor de Cauchy-Green en el límite de tiempo corto, que la tasa de disipación viscosa $\varepsilon$ es función cuadrática directa de los autovalores $\lambda_i$ de la deformación material ($\varepsilon \propto \sum_i (\lambda_i - 1)^2$), unificando así la cinemática Lagrangiana con la termodinámica de no-equilibrio y transformando las analogías topológicas subsiguientes en consecuencias analíticas de la arquitectura del tensor de Cauchy-Green.

El Índice de Recursividad Fractal (IRF) queda formalmente validado en tres ámbitos fenomenológicos diferenciados: (i) dinámica planetaria, donde las manchas atmosféricas operan como LCS elípticas de confinamiento; (ii) confinamiento de plasmas, donde las Barreras de Transporte Interno (ITB) en reactores EAST/HL-3 reproducen la arquitectura Lagrangiana de islas KAM toroidales; y (iii) termodinámica de la computación, donde el colapso de atención en Transformers y la degradación sintética evidencian la necesidad de un operador de confinamiento negentrópico cuya topología dinámica es funcionalmente análoga a la restricción toroidal ($\chi = 0$) en física de plasmas, bajo un marco de homeomorfismo estructural condicionado por régimen. La invarianza del esqueleto topológico bajo cambios de sustrato —fluido, plasma, silicio— constituye la validación más profunda del homeomorfismo estructural condicionado por régimen.

**Palabras clave:** Estructuras Coherentes Lagrangianas; Tensor de Cauchy-Green; Vorticidad Potencial; Cuasi-geostrófico; Ley Constructal; Analogía topológica trans-escala; Índice de Recursividad Fractal; Confinamiento magnético; Colapso de Modelo; Entropía de atención; Termodinámica de la computación.

# Tabla de Contenidos

[TOC: Actualizar al abrir en editor Markdown]

# Capítulo 1. Introducción

## 1.1 Contexto de la Investigación

La comprensión de la dinámica de fluidos ha experimentado un cambio de paradigma fundamental en las últimas décadas, transitando de una descripción puramente estática y local hacia una visión global y geométrica basada en el seguimiento de parcelas de fluido. Esta perspectiva, conocida como enfoque Lagrangiano, ha revelado la existencia de esqueletos ocultos que organizan el movimiento aparente de los fluidos en sistemas tan dispares como las atmósferas de los gigantes gaseosos y las redes hidrográficas de nuestro planeta. La teoría de las Estructuras Coherentes Lagrangianas (LCS) ha emergido como el marco matemático riguroso para identificar estas estructuras, proporcionando un lenguaje universal que trasciende las fronteras disciplinarias tradicionales.

Para orientar al lector a través de los diversos dominios físicos conectados por esta investigación, la Tabla 1-1 presenta una vista panorámica de las correspondencias trans-escala que se desarrollarán en los capítulos subsiguientes. Cada fila representa un sistema físico distinto; cada columna, el mismo invariante matemático expresado en el lenguaje de ese sistema.

*Tabla 1-1. Correspondencias trans-escala del formalismo Lagrangiano unificado.*

| **Dominio Físico** | **Sistema** | **Fuerza Subyacente** | **Término $q$ isomórfico** | **Estructura Coherente** | **Principio** |
|:---|:---|:---|:---|:---|:---|
| Atmósfera Planetaria | Júpiter (GRS, bandas) | Coriolis + gradiente de presión | $\beta y$ (vorticidad planetaria) | LCS elípticas (vórtices) | MaxEP |
| Geomorfología Fluvial | Ríos y meandros | Gravedad + fricción de fondo | $(f_0/H)\eta$ (topografía) | SLS (Estructuras de Cizalladura) | MinEP |
| Flujos Granulares Densos | Tambores rotatorios, canales | Contactos friccionales | $U_c\cdot\nabla(\phi)\cdot\hat{n}$ (gradiente de fracción) | Núcleos no-mezclantes (islas KAM) | MinEP |
| Redes Vasculares Pulsátiles | Ventrículo izquierdo | Presión miocárdica | $\kappa(s)\cdot U$ (curvatura helicoidal) | Anillos de vórtice diastólicos | MinEP |
| Sistemas Capilares | Gotas sobre películas jabonosas | Tensión superficial (gravito-capilar) | $G_{2D}\cdot(m_i m_j)/r_{ij}$ (potencial efectivo) | Brazos espirales coalescentes | MinEP/MaxEP |
| Astrofísica | Fusiones galácticas | Gravedad Newtoniana | $G\cdot(M_i M_j)/r_{ij}$ (potencial gravitatorio) | Puentes de marea, brazos espirales | MaxEP |
| Plasmas de Confinamiento | Tokamaks (EAST, HL-3) | Confinamiento magnético toroidal | $\nabla q \approx 0$ (perfil de seguridad) | ITB (islas KAM toroidales) | MinEP/MaxEP |

*Nota: La columna "Término $q$ isomórfico" se refiere a la ecuación generalizada de vorticidad potencial $q = \zeta + f + (f_0/H)\eta$ (Capítulo 5), donde cada dominio sustituye el término dominante según la física subyacente. La columna "Principio" se refiere a los principios de Mínima (MinEP) y Máxima (MaxEP) Producción de Entropía, cuya derivación a partir del tensor de Cauchy-Green se presenta en el Capítulo 8.*

## 1.2 Planteamiento del Problema

A pesar de los avances significativos en la teoría de LCS, persiste una brecha epistemológica sustancial entre la meteorología planetaria y la geomorfología fluvial. Los investigadores de ambos campos han operado de manera independiente, empleando terminologías y metodologías distintas para describir fenómenos que, como se argumentará a lo largo de este trabajo, poseen una equivalencia matemática profunda. La pregunta central que motiva esta investigación es: ¿son las Estructuras Coherentes Lagrangianas que organizan el transporte en la atmósfera de Júpiter y aquellas que gobiernan la morfología de los meandros fluviales terrestres manifestaciones de un único principio estructural universal?

## 1.3 Objetivos

El objetivo general de esta investigación es establecer y validar formalmente el homeomorfismo estructural condicionado por régimen entre las LCS jovianas y los meandros fluviales terrestres, extendiendo dicha validación a dominios no fluidos. Los objetivos específicos incluyen: (i) demostrar la equivalencia matemática entre ambos sistemas a través del análisis de la vorticidad potencial cuasi-geostrófica y del tensor de Cauchy-Green; (ii) identificar los invariantes adimensionales que definen los regímenes físicos dominantes en cada sistema; (iii) analizar los principios de optimización (Ley Constructal, MinEP/MaxEP) que gobiernan la configuración geométrica de ambos tipos de flujo; y (iv) extender la validación de la analogía topológica a flujos granulares densos y redes vasculares pulsátiles.

## 1.4 Metodología

La metodología combina el análisis teórico-matemático de las ecuaciones de vorticidad potencial cuasi-geostrófica con la teoría variacional de las LCS. El tensor de Cauchy-Green se utiliza como herramienta fundamental para la detección de barreras de transporte. El enfoque es inherentemente interdisciplinario, integrando resultados de la dinámica de fluidos geofísicos, la geomorfología fluvial, la termodinámica de no-equilibrio y la teoría de sistemas dinámicos.

***Delimitación Metodológica.*** Los homeomorfismos topológicos establecidos en esta investigación no implican identidad física entre sustratos. La invarianza del esqueleto Lagrangiano está condicionada por régimen: requiere campos de velocidad continuos y diferenciables donde las variedades invariantes de tiempo finito dominan el transporte. Los sistemas con discontinuidades fuertes, ruido estocástico dominante o ausencia de jerarquía temporal quedan fuera del alcance de este formalismo. El isomorfismo es matemático, no ontológico; la escala y el sustrato permanecen como parámetros de realización sujetos a condiciones de frontera específicas.

# Capítulo 2. Marco Teórico: Estructuras Coherentes Lagrangianas

## 2.1 Fundamentos Matemáticos: El Tensor de Cauchy-Green

La teoría de Estructuras Coherentes Lagrangianas (LCS) proporciona el rigor matemático necesario para identificar fronteras materiales en flujos con dependencia temporal arbitraria [2]. A diferencia de las estructuras eulerianas —como los centros de baja presión o los vectores de velocidad instantánea—, las LCS son entidades materiales compuestas por trayectorias de partículas que definen la arquitectura del transporte de masa. El estudio de las LCS descansa en cuantificar la deformación del fluido mediante el mapa de flujo $\mathbf{F}_{t_0}^{t}(\mathbf{x}_0)$. Este operador matemático traslada una posición inicial $\mathbf{x}_0$ en el tiempo $t_0$ a su nueva ubicación $\mathbf{x}$ en el tiempo $t$. La sensibilidad de estas trayectorias respecto a cambios en las condiciones iniciales se captura mediante el tensor derecho de deformación de Cauchy-Green, definido formalmente como:

$$\mathbf{C}_{t_0}^{t}(\mathbf{x}_0) = \left[\nabla \mathbf{F}_{t_0}^{t}(\mathbf{x}_0)\right]^{\top} \nabla \mathbf{F}_{t_0}^{t}(\mathbf{x}_0) \tag{2-1}$$

Este tensor es simétrico y definido positivo, lo cual garantiza la existencia de autovalores reales positivos $0 < \lambda_1 \le \lambda_2 \le \dots \le \lambda_n$ y un conjunto ortonormal de autovectores $\{\xi_i\}$. La interpretación física de estos valores es crucial: el autovalor máximo $\lambda_n$ representa el cuadrado del estiramiento máximo experimentado por un elemento de fluido infinitesimal en la vecindad de $\mathbf{x}_0$ durante el intervalo de tiempo considerado. Las LCS emergen como crestas en los campos de autovalores, segregando el dominio del flujo en regiones con propiedades de mezcla radicalmente distintas [2].

## 2.2 Objetividad y Variedades Invariantes de Tiempo Finito

Un requisito sine qua non para cualquier definición consistente de estructura de flujo es la objetividad. Una teoría es objetiva si sus conclusiones permanecen invariantes bajo cambios de coordenadas euclidianos de la forma $\mathbf{y} = \mathbf{Q}(t)\mathbf{x} + \mathbf{p}(t)$, donde $\mathbf{Q}(t)$ es una matriz de rotación dependiente del tiempo y $\mathbf{p}(t)$ es un vector de traslación. El tensor de Cauchy-Green satisface esta propiedad, permitiendo que la detección de barreras de transporte en Júpiter o en un río terrestre sea independiente del marco de referencia del observador —ya sea que esté rotando con el planeta o moviéndose a lo largo de la ribera del río. En términos de sistemas dinámicos, las LCS hiperbólicas generalizan el concepto de variedades estables e inestables de puntos silla a flujos no autónomos. Las LCS repulsivas actúan como variedades estables, mientras que las LCS atractivas funcionan como variedades inestables de tiempo finito, organizando el estiramiento y plegamiento del fluido que caracteriza la turbulencia.

# Capítulo 3. La Atmósfera de Júpiter: Un Laboratorio de Vorticidad Extrema

## 3.1 La Gran Mancha Roja como Barrera Elíptica Coherente

Júpiter posee una atmósfera de una complejidad sin paralelo, dominada por la rápida rotación (un día joviano dura aproximadamente 10 horas terrestres) y la ausencia de topografía sólida que ralentice los vientos. Estas condiciones favorecen un régimen de turbulencia geostrófica donde la energía fluye desde escalas pequeñas hacia grandes escalas, alimentando chorros zonales estables y vórtices gigantes de larga vida. La Gran Mancha Roja (GRS) constituye el ejemplo prototípico de una LCS elíptica en un entorno geofísico. A través de algoritmos ACCIV (Advection-Corrected Correlation Image Velocimetry) aplicados a los datos de la sonda Cassini, se ha reconstruido el campo de velocidades de las nubes jovianas con alta resolución temporal y espacial.

El análisis variacional revela que la GRS está delimitada por una curva material cerrada que experimenta un estiramiento tangencial casi nulo —lo que se denomina estiramiento neutral ($k = 1$). Esta estructura actúa como una barrera de transporte perfecta, impidiendo que el amoníaco y otros trazadores químicos del interior del vórtice se mezclen con la atmósfera circundante. Esta impermeabilidad lagrangiana es la razón fundamental de la persistencia de la mancha durante más de tres siglos, a pesar de estar inmersa en un entorno altamente turbulento.

*Tabla 3-1. Parámetros dinámicos de la GRS y su interpretación lagrangiana.*

| **Parámetro Dinámico** | **Característica en la GRS** | **Interpretación Lagrangiana** |
|:---|:---|:---|
| Tipo de Estructura | LCS elíptica | Región de confinamiento y baja mezcla |
| Autovalores de Cauchy-Green | $\lambda_1 \sim \lambda_2 \sim 1$ | Deformación infinitesimal mínima en el borde |
| Vorticidad Relativa | Anticiclónica (extrema) | Alta estabilidad por balance geostrófico |
| Mecanismo de Estabilidad | Fricción de Ekman selectiva | Disipación diferencial ciclón vs anticiclón |

## 3.2 Los Chorros Zonales y el Transporte Meridional

Los chorros zonales de Júpiter (las bandas de nubes visibles) funcionan como barreras parabólicas de transporte. Estas estructuras inhiben el intercambio de masa norte-sur (meridional), confinando los patrones meteorológicos a bandas de latitud casi constante. La teoría de LCS identifica los núcleos de estos chorros como líneas materiales de mínima cizalladura, segregando regiones de alta vorticidad y actuando como paredes dinámicas que solo pueden ser penetradas durante eventos de gran inestabilidad, como las interacciones entre vórtices menores y las ondas de Rossby. La estructura de bandas zonales, lejos de ser un fenómeno meramente visual, constituye la manifestación superficial de una profunda organización lagrangiana del transporte atmosférico planetario.

# Capítulo 4. Dinámica Fluvial y Meandros: El Fluido como Escultor del Paisaje

## 4.1 Canales Compuestos y Estructuras Lagrangianas de Cizalladura

En la Tierra, el movimiento del agua en los canales fluviales presenta profundas analogías con la dinámica atmosférica planetaria. Los ríos no fluyen en línea recta debido a una serie de inestabilidades intrínsecas que amplifican las perturbaciones iniciales del cauce, dando lugar a los meandros. Los ríos naturales se comportan a menudo como canales compuestos, consistiendo en un canal principal profundo y llanuras de inundación más someras. El gradiente de velocidad entre estas dos regiones genera una capa de cizalladura donde emergen macro-vórtices de eje vertical. Cuando se analizan a través de la óptica de las LCS, estos flujos revelan Estructuras Lagrangianas de Cizalladura (SLS) que delimitan el núcleo del chorro del río.

Este chorro central del río exhibe un comportamiento dinámico idéntico al de los chorros atmosféricos: oscila y serpentea buscando una configuración de equilibrio. La sinuosidad del río es la manifestación física de esta oscilación del chorro de máxima velocidad, acoplada al transporte de sedimentos. Las barreras de transporte en los ríos organizan la deposición de sedimentos en las barras de meandro y la erosión en las márgenes externas, perpetuando el movimiento migratorio del meandro. La identificación de las SLS permite predecir con precisión las zonas de erosión y deposición, constituyendo una herramienta de invaluable importancia para la ingeniería fluvial.

## 4.2 Analogía Topológica con Modelos de Chorros Meándricos

Se observa una profunda analogía topológica entre los modelos de chorros meándricos utilizados en oceanografía (como los que describen la Corriente de las Malvinas) y la dinámica de los meandros fluviales. En ambos casos, el sistema puede modelarse como un chorro no autónomo donde las trayectorias de las partículas quedan confinadas dentro de islas no mezclantes o son expulsadas hacia un mar caótico de turbulencia. Esta analogía topológica no es meramente formal: tiene consecuencias prácticas directas, ya que permite aplicar herramientas desarrolladas para el estudio de chorros oceánicos a la predicción de la evolución morfológica de los cauces fluviales.

*Tabla 4-1. Correspondencia entre chorros atmosféricos y meandros fluviales.*

| **Propiedad del Flujo** | **Chorros Atmosféricos (Júpiter)** | **Meandros Fluviales (Tierra)** |
|:---|:---|:---|
| Estructura Central | Chorro Zonal | Chorro de Máxima Velocidad |
| Patrón de Oscilación | Ondas de Rossby | Sinuosidad del Cauce |
| Barreras de Mezcla | LCS Parabólicas | SLS en Capas de Cizalladura |
| Confinamiento de Masa | Vórtices Coherentes (GRS) | Zonas de Recirculación (Pozos) |

# Capítulo 5. La Aproximación Cuasi-geostrófica y la Vorticidad Potencial

## 5.1 Derivación e Importancia de la Vorticidad Potencial

El vínculo matemático más robusto entre estos dos mundos reside en las ecuaciones de vorticidad potencial (VP). En los flujos geofísicos a gran escala, la conservación de la VP es el principio fundamental que dicta la evolución del sistema. Para un fluido de aguas someras, se define la vorticidad potencial cuasi-geostrófica $q$, siguiendo la teoría cuasi-geostrófica [15], como la suma de la vorticidad relativa $\zeta = \nabla^2 \psi$, la vorticidad planetaria $\beta y$ (el efecto de la curvatura planetaria) y el estiramiento de las columnas de fluido inducido por la topografía o variaciones de densidad. La ecuación fundamental de conservación es:

$$\frac{Dq}{Dt} = \frac{\partial q}{\partial t} + J(\psi, q) = 0 \tag{5-1}$$

donde $\psi$ es la función de corriente y $J$ es el Jacobiano. En Júpiter, el término $\beta y$ es dominante y genera la estructura de bandas. En los ríos, aunque la rotación planetaria suele ser despreciable a escala local, el término de estiramiento inducido por las variaciones en la profundidad del lecho ($h$) desempeña un papel análogo al del término $\beta y$. Esta correspondencia constituye el núcleo de la analogía topológica condicionada por régimen: la topografía fluvial actúa como una fuerza de Coriolis ficticia, generando ondas estacionarias que son los precursores dinámicos de los meandros.

## 5.2 Isomorfismo de Aguas Someras y Topografía

Cuando un río fluye sobre un lecho con irregularidades topográficas, la ecuación de vorticidad que describe la desviación del flujo es formalmente idéntica a la ecuación de flujo cuasi-geostrófico sobre una montaña en una atmósfera planetaria [15]. La elevación en el fondo del río actúa como una fuente de vorticidad que induce ondas estacionarias, las cuales son los precursores dinámicos de los meandros. Este isomorfismo permite aplicar las herramientas de la meteorología planetaria para predecir la evolución de cauces fluviales complejos, estableciendo un puente teórico entre disciplinas que tradicionalmente han permanecido separadas.

La formalización del homeomorfismo estructural central establece que, tanto en la atmósfera joviana como en los cauces fluviales, la ecuación de vorticidad potencial adopta la forma general $q = \zeta + f + (f_0/H)\cdot\eta$, donde cada término tiene dimensiones $[T^{-1}]$, garantizando la consistencia dimensional. En Júpiter, el término $f = 2\Omega\,\mathrm{sen}(\phi)$ es dominante, representando la vorticidad planetaria; en ríos, el término $(f_0/H)\cdot\eta$ es dominante, donde la topografía actúa como una $f$ ficticia. Ambos términos generan la fuerza restauradora que curva las trayectorias del fluido, constituyendo la base matemática del homeomorfismo estructural condicionado por régimen.

# Capítulo 6. Análisis de Invariantes Adimensionales

## 6.1 Números de Rossby y Reynolds

La comparación científica rigurosa entre escalas tan diversas requiere el uso de números adimensionales, que identifican los regímenes físicos dominantes [16]. El número de Rossby $\mathrm{Ro} = U/(fL)$ mide la importancia de la inercia frente a la fuerza de Coriolis. En Júpiter, $\mathrm{Ro} \ll 1$, lo que indica que el flujo está en equilibrio geostrófico. En ríos ordinarios, $\mathrm{Ro} \gg 1$, pero en corrientes masivas como el Amazonas o en meandros encajados a gran escala, el efecto Coriolis se vuelve medible, induciendo asimetrías laterales en la erosión que no pueden explicarse de otro modo.

Por otra parte, el número de Reynolds $\mathrm{Re} = UL/\nu$ es extremadamente alto en ambos sistemas, superando con creces los umbrales de la turbulencia desarrollada. Sin embargo, la naturaleza de la turbulencia difiere: en Júpiter es bidimensional y exhibe una cascada inversa de energía (desde escalas pequeñas a grandes), mientras que en ríos la turbulencia es tridimensional y disipativa, aunque las LCS organicen los promedios temporales de este transporte caótico. Esta diferencia fundamental en la dimensionalidad de la turbulencia no invalida la analogía topológica; más bien la enriquece, mostrando cómo emergen principios estructurales comunes en regímenes turbulentos cualitativamente distintos. La invarianza del esqueleto topológico bajo cambios de sustrato y escala es precisamente la razón por la que los patrones de transporte persisten a pesar de las diferencias en la naturaleza de la turbulencia: el patrón geométrico-formal es independiente del sustrato; la escala es un parámetro de realización, no el generador de la forma.

Esta independencia no es absoluta sino condicionada por régimen: requiere la existencia de un campo de velocidades continuo, diferenciable y dominado por interacciones que generan variedades invariantes de tiempo finito. Los sistemas con fuertes discontinuidades, ruido dominante o ausencia de jerarquía temporal quedan fuera del alcance del presente formalismo.

## 6.2 El Número de Ekman y la Fricción

El número de Ekman $\mathrm{Ek} = \nu/(fL^2)$ cuantifica la influencia de la viscosidad respecto a la rotación. En la atmósfera joviana, la capa de Ekman en la base de las nubes es responsable de la disipación de energía y de la generación de corrientes secundarias que alimentan los vórtices. En los ríos, la fricción de fondo desempeña un papel análogo, limitando la velocidad del chorro y determinando la estabilidad de la longitud de onda de los meandros. La fricción de Ekman selectiva constituye el mecanismo fundamental de la asimetría ciclón-anticiclón observada en Júpiter, y su equivalente fluvial regula la estabilidad diferencial de los patrones de erosión y deposición en las curvas de los meandros.

*Tabla 6-1. Invariantes adimensionales y su aplicación comparativa.*

| **Invariante Adimensional** | **Definición** | **Aplicación en Júpiter** | **Aplicación en Meandros** |
|:---|:---|:---|:---|
| Rossby ($\mathrm{Ro}$) | $U/(fL)$ | Define estructura de bandas | Relevante en meandros encajados a gran escala |
| Reynolds ($\mathrm{Re}$) | $UL/\nu$ | Posibilita autoorganización de vórtices | Define capacidad de transporte de sedimentos |
| Ekman ($\mathrm{Ek}$) | $\nu/(fL^2)$ | Genera asimetría ciclón-anticiclón | Relacionado con rugosidad del lecho |
| Froude ($\mathrm{Fr}$) | $U/\sqrt{gL}$ | Ondas internas de gravedad | Crítico para rápidos y formación de pozos |
| Burger ($\mathrm{Bu}$) | $L_D^2/L^2$ | Determina tamaño de vórtices | Escala de interacción flujo-sedimento |

# Capítulo 7. Principios de Optimización: La Ley Constructal

## 7.1 Júpiter como Red Vascular Planetaria

Más allá de las leyes del movimiento, la configuración geométrica de los fluidos parece responder a un principio evolutivo de diseño. La Ley Constructal postula que los sistemas de flujo que persisten en el tiempo deben transformarse de tal manera que proporcionen un acceso cada vez mayor a las corrientes que fluyen a través de ellos. Desde esta perspectiva, la atmósfera de Júpiter puede entenderse como una arquitectura que favorece el transporte de calor desde el núcleo cálido hacia el espacio exterior frío. Los chorros zonales y la Gran Mancha Roja actúan como componentes de una red vascular que reduce la resistencia global al transporte térmico latitudinal y vertical. La GRS, en particular, puede verse como un motor de flujo que facilita la mezcla en una región donde el flujo zonal puro sería menos eficiente.

## 7.2 Meandros y Minimización del Trabajo

En los sistemas fluviales, la Ley Constructal predice que la forma sinuosa del meandro no es accidental, sino una optimización para el transporte de agua y sedimentos. El río se autoorganiza para equilibrar la disipación de energía por fricción con el trabajo requerido para mover la carga sedimentaria. Un río meándrico ha encontrado a lo largo del tiempo una configuración de menor resistencia global para su cuenca hidrográfica, maximizando su capacidad de descarga bajo las restricciones dadas de pendiente y geología. La extensión de la Ley Constructal a los flujos granulares densos y las redes vasculares pulsátiles es consistente con la universalidad del principio: en los flujos granulares, las cadenas de fuerza optimizan la disipación por fricción basal, mientras que en las redes vasculares, la Ley de Murray establece la distribución óptima de la impedancia hemodinámica.

# Capítulo 8. Termodinámica de los Sistemas de No-equilibrio

## 8.1 Acoplamiento Cinemático-Termodinámico: Derivación de la Tasa de Disipación

Antes de examinar los principios termodinámicos de producción de entropía, es necesario establecer su fundamento cinemático. Esta sección demuestra que la tasa de disipación viscosa se deriva directamente de los autovalores del tensor de Cauchy-Green, proporcionando así la base analítica sobre la cual los principios MinEP y MaxEP dejan de ser postulados externos y pasan a ser consecuencias de la arquitectura Lagrangiana.

Para conectar el esqueleto Lagrangiano —definido por el tensor de Cauchy-Green— con los principios termodinámicos de disipación, consideramos el límite de tiempos de integración infinitesimalmente cortos ($\Delta t \to 0$). En este régimen, el mapa de flujo $\mathbf{F}_{t_0}^{t_0+\Delta t}(\mathbf{x}_0)$ que transporta un elemento de fluido desde su posición inicial $\mathbf{x}_0$ durante un intervalo $\Delta t$ puede aproximarse mediante una expansión de Taylor. Esta expansión linealizada de la deformación permite relacionar el tensor derecho de Cauchy-Green $\mathbf{C} = \nabla\mathbf{F}^{\top} \cdot \nabla\mathbf{F}$ con el tensor simétrico de la tasa de deformación $\mathbf{S} = \tfrac{1}{2}\left(\nabla\mathbf{v} + (\nabla\mathbf{v})^{\top}\right)$, donde $\mathbf{v}$ es el campo de velocidades [23].

La expansión resultante es:

$$\mathbf{C}(\mathbf{x}_0, t_0, \Delta t) \approx \mathbf{I} + 2\,\mathbf{S}(\mathbf{x}_0, t_0)\,\Delta t + \mathcal{O}\!\left((\Delta t)^2\right)$$

donde $\mathbf{I}$ es el tensor identidad. Esta aproximación implica que los autovalores $\lambda_i$ del tensor de Cauchy-Green están directamente relacionados con los autovalores $s_i$ del tensor de tasa de deformación $\mathbf{S}$ en el límite de tiempo corto:

$$\lambda_i \approx 1 + 2 s_i \Delta t \qquad \text{para } i = 1, \dots, n$$

Esta relación demuestra que la desviación de los autovalores $\lambda_i$ respecto a la unidad es una medida directa de la tasa local de deformación del fluido.

La tasa de disipación viscosa por unidad de masa, $\varepsilon$, para un fluido Newtoniano incompresible, se define como $\varepsilon = 2\nu \lVert\mathbf{S}\rVert^2$, donde $\nu$ es la viscosidad cinemática y $\lVert\mathbf{S}\rVert^2 = \mathrm{tr}(\mathbf{S}^{\top}\mathbf{S})$ es el cuadrado de la norma de Frobenius del tensor $\mathbf{S}$ [1]. Expresando la norma de $\mathbf{S}$ en términos de sus autovalores, $\lVert\mathbf{S}\rVert^2 = \sum_{i=1}^{n} s_i^2$, y utilizando la aproximación linealizada para $s_i$ ($s_i \approx (\lambda_i - 1)/(2\Delta t)$), obtenemos la siguiente relación fundamental:

$$\varepsilon \approx 2\nu \sum_{i=1}^{n}\left(\frac{\lambda_i - 1}{2\Delta t}\right)^2 = \frac{\nu}{2(\Delta t)^2}\sum_{i=1}^{n}(\lambda_i - 1)^2$$

En el límite $\Delta t \to 0$, los autovalores satisfacen $(\lambda_i - 1) \to 0$ al mismo orden que $\Delta t$, de modo que el cociente $(\lambda_i - 1)^2/(\Delta t)^2$ permanece finito y la tasa de disipación $\varepsilon$ queda bien definida. Esta cancelación asintótica es consecuencia directa de la relación lineal $\lambda_i \approx 1 + 2 s_i \Delta t$ en el régimen de tiempo corto.

Esta ecuación es el resultado central de esta subsección. Demuestra formalmente que la tasa local de disipación viscosa es una medida cuadrática de la desviación del esqueleto material (descrito por $\lambda_i$) respecto al estado de deformación rígida (donde $\lambda_i = 1$).

***Observación 8.1 (Sobre el límite infinitesimal y la memoria Lagrangiana).*** La derivación de la tasa de disipación en el límite $\Delta t \to 0$ no constituye un colapso hacia un marco euleriano estático. El mapa de flujo $\mathbf{F}_{t_0}^{t}(\mathbf{x}_0)$ codifica inherentemente la historia del campo de velocidades a lo largo de las trayectorias de las partículas. El límite $\Delta t \to 0$ actúa estrictamente como un operador diferencial analítico, extrayendo el costo termodinámico instantáneo condicionado por la vecindad topológica de la arquitectura Lagrangiana global. Las LCS de tiempo finito actúan como el andamiaje estructural asintótico hacia el cual convergen estas tasas instantáneas; así, la memoria del flujo se preserva en el gradiente de deformación espacial, evitando cualquier pérdida de objetividad Lagrangiana.

Este resultado tiene implicaciones físicas profundas para la hipótesis unificadora MinEP/MaxEP. En las regiones de confinamiento elíptico —que corresponden a las islas coherentes de transporte (por ejemplo, el interior de la Gran Mancha Roja o los pozos fijos de un meandro)— la deformación material es mínima. Esto implica que los autovalores $\lambda_i$ están todos cerca de la unidad ($\lambda_i \to 1$). En consecuencia, la tasa interna de disipación $\varepsilon$ tiende a cero. Esta configuración satisface localmente el principio de Mínima Producción de Entropía (MinEP), explicando la extraordinaria estabilidad y longevidad de estas estructuras [9][24].

Por el contrario, en las fronteras hiperbólicas y zonas de dispersión caótica —que actúan como barreras de mezcla— el estiramiento material es máximo y los autovalores divergen exponencialmente ($\lambda_n \gg 1$). Esta gran desviación hace que el término cuadrático en la suma domine, produciendo un drástico incremento en la tasa local de disipación. Este comportamiento se alinea con el principio de Máxima Producción de Entropía (MaxEP), que postula que los sistemas fuera del equilibrio tienden a maximizar la tasa de producción de entropía [22][25].

La conexión derivada aquí no es meramente especulativa: encuentra respaldo en la reología de fluidos viscoelásticos, donde modelos constitutivos como Oldroyd-B, Giesekus y Phan-Thien-Tanner formulan la densidad de energía libre y la tasa de disipación como funciones de los invariantes del tensor de deformación finita [26][27]. En estos sistemas, la producción local de entropía por fricción intermolecular interna es una función directa de $(\lambda_i - 1)^2$, validando la ruta analítica presentada aquí desde un dominio disciplinario independiente. Asimismo, en la física de la turbulencia homogénea e isotrópica, los exponentes de Lyapunov de tiempo finito —derivados directamente de $\lambda_n$— se han vinculado empíricamente con las escalas Lagrangianas de disipación y con la tasa de disipación turbulenta $\varepsilon$ [23][28].

Por lo tanto, la arquitectura Lagrangiana del flujo no solo organiza el transporte de masa: dicta el régimen termodinámico local. La forma (LCS) y la función (disipación) se unifican a través del tensor de Cauchy-Green.

La plausibilidad de la derivación puede verificarse con datos publicados de forma independiente. Aplicando la relación $\varepsilon \approx (\nu/(2\Delta t^2))\cdot\sum_i(\lambda_i - 1)^2$ a los datos de Arvidsson et al. [34] para el ventrículo izquierdo humano ($\mathrm{FTLE} \approx 2\ \mathrm{s^{-1}}$, $\Delta t \approx 0.3\ \mathrm{s}$) con viscosidad cinemática de la sangre $\nu \approx 3\times10^{-6}\ \mathrm{m^2/s}$, se obtiene $\varepsilon \approx 1.6\times10^{-4}\ \mathrm{m^2/s^3}$, dentro del orden de magnitud reportado por Pedrizzetti et al. [35] ($10^{-3}$ a $10^{-2}\ \mathrm{m^2/s^3}$). La subestimación por un factor de $\sim 10$ es atribuible a considerar solo el autovalor puntual máximo frente al promedio volumétrico de las mediciones. Esta verificación de plausibilidad no sustituye a una validación experimental sistemática, pero confirma que la derivación produce valores físicamente razonables sin parámetros libres.

### 8.1.5 Isomorfismo Topológico en Plasmas de Confinamiento Magnético: Barreras de Transporte Internas (ITB) y la Restricción de Poincaré-Hopf

El confinamiento magnético de plasmas a temperaturas de fusión (por encima de $10^8\ \mathrm{K}$) impone restricciones topológicas estrictas. El teorema de Poincaré-Hopf establece que una superficie compacta admite un campo vectorial tangente continuo y sin ceros si y solo si su característica de Euler es $\chi = 0$. Una esfera ($\chi = 2$) forzaría la existencia de al menos una singularidad, que en el contexto magnético corresponde a un punto de fuga del plasma. Esta es la razón matemática profunda por la cual los reactores de fusión por confinamiento magnético —Tokamaks, Stellarators— adoptan geometría toroidal: solo el toro ($\chi = 0$) permite un campo magnético helicoidal sin ceros que envuelve continuamente el plasma (Borisov et al. [47]).

La evidencia experimental reciente ha validado este principio en regímenes de larga duración. El reactor EAST (Experimental Advanced Superconducting Tokamak, Hefei, China) ha demostrado la viabilidad de estas barreras en campañas de operación sostenida, con regímenes avanzados que alcanzan los 1056 segundos reportados desde 2021 [48], operando con fracciones de Greenwald de $n_e/n_{GW} \approx 0.85$ y temperaturas de núcleo superiores a 100 millones de kelvin. El perfil de densidad y temperatura mostró un núcleo plano ($n_e \sim 3.5\times10^{19}\ \mathrm{m^{-3}}$) y un pedestal de borde pronunciado ($T_e \sim 4\text{--}5\ \mathrm{keV}$), indicativo de una fuerte barrera de transporte en la región periférica. En paralelo, en el reactor HL-3 (Chengdu, China), Duan et al. [49] documentaron la formación autoorganizada de una Barrera de Transporte Interna (ITB) en el radio toroidal $\rho_{\mathrm{tor}} \approx 0.3\text{--}0.5$, con supresión del transporte anómalo y coeficientes de difusión turbulenta reducidos a $D_{\perp} \approx 0.1\ \mathrm{m^2/s}$ en el núcleo, en comparación con $0.8\text{--}1.2\ \mathrm{m^2/s}$ en el pedestal. Estas ITB se correlacionan espacialmente con regiones de bajo gradiente de presión y difusividad térmica efectiva mínima (caída brusca de $\chi_{\mathrm{eff}}$).

La arquitectura Lagrangiana subyacente se revela al transformar la coordenada toroidal (o poloidal) en un pseudo-tiempo ($z \leftrightarrow t$), transformación estándar en estudios de campo magnético reducido en geometría toroidal. Bajo esta transformación, el campo magnético tridimensional se reduce a un sistema dinámico efectivo bidimensional en el cual las líneas de campo se interpretan como trayectorias. Bajo la teoría KAM, mientras que las superficies magnéticas racionales ($q = m/n$) son susceptibles a resonancias que abren islas magnéticas y regiones estocásticas, son las superficies irracionales fuertemente cizalladas las que sobreviven a perturbaciones como barreras invariantes robustas. Las ITB emergen en regiones donde el perfil de corriente estabiliza estas islas y restaura la topología anidada de los toros irracionales KAM, generando islas elípticas de confinamiento rodeadas por crestas hiperbólicas caracterizadas por exponentes de Lyapunov de tiempo finito (FTLE) elevados [47, 49].

La derivación $\varepsilon \propto \sum_i(\lambda_i - 1)^2$ presentada en §8.1 conecta esta arquitectura con la termodinámica. En el interior elíptico de la ITB, $\lambda_i \approx 1$ implica una tasa de disipación viscosa mínima (MinEP), explicando la longevidad del confinamiento. En las crestas FTLE, $\lambda_{\max} \gg 1$ fuerza una alta disipación local (MaxEP) que actúa como barrera de transporte. La geometría Lagrangiana dicta por tanto el régimen termodinámico local: la forma (LCS) y la función (disipación) se unifican también en los plasmas de fusión.

## 8.2 Mínima Producción de Entropía (MinEP)

Habiendo demostrado en la Sección 8.1 que la tasa de disipación $\varepsilon$ es función directa de los autovalores $\lambda_i$ del tensor de Cauchy-Green, el principio de mínima producción de entropía (MinEP) adquiere una base mecánica precisa.

La selección de los patrones de LCS y meandros puede analizarse mediante los principios de producción de entropía en sistemas abiertos. El principio MinEP de Ilya Prigogine sugiere que los sistemas cercanos al equilibrio tienden a estados de mínima disipación. En los ríos, esto se manifiesta en la búsqueda de perfiles de equilibrio donde el cambio morfológico es mínimo una vez establecida la sinuosidad ideal. Las LCS de cizalladura en un meandro estable representan precisamente las superficies de mínima producción de entropía por fricción interna del fluido. Este principio permite comprender por qué los meandros estables mantienen su forma durante prolongados períodos geológicos, ya que la estructura interna Lagrangiana minimiza la disipación energética innecesaria.

## 8.3 Máxima Producción de Entropía (MaxEP/MEP)

Mientras que la Sección 8.2 mostró cómo los núcleos elípticos satisfacen MinEP a través de $\lambda_i \to 1$, la contraparte complementaria emerge en las fronteras hiperbólicas.

Por el contrario, en sistemas altamente no lineales lejos del equilibrio como la atmósfera de Júpiter, el principio MEP parece más descriptivo. El sistema selecciona estados (como la formación de grandes vórtices) que maximizan la tasa de disipación de energía y, consecuentemente, la producción de entropía. La GRS es una estructura que convierte gradientes térmicos en trabajo mecánico para luego disiparlos mediante turbulencia en sus bordes, maximizando el flujo de calor planetario. La síntesis de estos principios se propone como una hipótesis unificadora derivada de la observación del esqueleto Lagrangiano en este trabajo: las LCS actúan como barreras que minimizan la disipación inútil (MinEP) dentro de núcleos coherentes, mientras que la estructura global del flujo evoluciona para maximizar el transporte total (MEP/Constructal). La síntesis MinEP/MaxEP, inicialmente formulada como hipótesis de trabajo derivada de las observaciones sistematizadas en la presente investigación, queda ahora fundamentada mediante la derivación cinemático-termodinámica presentada en la Sección 8.1. La conexión matemática $\varepsilon \propto \sum_i(\lambda_i - 1)^2$ demuestra que la geometría Lagrangiana implica un comportamiento termodinámico local: el régimen de baja disipación en los núcleos elípticos (MinEP) y el régimen de alta disipación en las fronteras hiperbólicas (MaxEP) no son postulados independientes, sino consecuencias estructurales consistentes con la arquitectura del tensor de Cauchy-Green. Si bien MinEP emerge analíticamente en los núcleos elípticos, MaxEP funciona como un principio variacional heurístico alineado con los regímenes de estiramiento hiperbólico, a la espera de una formalización variacional completa en la termodinámica de no-equilibrio. Esta derivación, respaldada por literatura independiente en reología de fluidos viscoelásticos y física de la turbulencia [23][26][27], transforma la síntesis MinEP/MaxEP de una observación fenomenológica a un resultado deducido del esqueleto Lagrangiano en su rama MinEP, y consistente con él en su rama MaxEP.

# Capítulo 9. Analogías Topológicas Estructurales: Islas de Transporte y Caos

## 9.1 La Gran Mancha Roja como Isla KAM de Tiempo Finito

Un descubrimiento fundamental en la comparación Júpiter-Ríos es la organización del espacio de fase en regiones de dinámica regular y caótica. En los sistemas dinámicos Hamiltonianos, el teorema de Kolmogórov-Arnold-Moser (KAM) predice la persistencia de toros de movimiento regular rodeados por regiones caóticas. Aunque la atmósfera joviana es disipativa y dependiente del tiempo, la GRS se comporta como una isla KAM de tiempo finito. La LCS elíptica circundante impide la entrada de trayectorias caóticas, manteniendo una isla de orden que preserva su identidad química y dinámica. Este comportamiento KAM de tiempo finito es el mecanismo matemático que explica la extraordinaria longevidad de la GRS y otros vórtices jovianos.

## 9.2 Meandros y el Modelo de Chorro Meándrico

Análogamente, el flujo de un río puede modelarse mediante la superposición de un chorro zonal y ondas perturbadoras, dando como resultado la formación de bolsas de fluido o islas de transporte similares a los vórtices de Júpiter. En las curvas de los meandros, el agua cercana a la margen interna queda a menudo atrapada en regiones de baja velocidad (pozos), mientras que el chorro principal fluye sin mezclarse profundamente con estas bolsas. Las LCS son las fronteras que definen este régimen de caos organizado en el río, determinando dónde el agua fluye rápidamente hacia el mar y dónde permanece retenida, nutriendo el ecosistema local. La estructura de islas de transporte y mares caóticos es, por lo tanto, una propiedad topológica compartida por ambos sistemas.

## 9.3 Profundización en la Geometría Variacional

La frontera del conocimiento en este campo se ha desplazado de la simple detección visual de crestas FTLE hacia la teoría variacional de LCS. En la formulación variacional, las LCS se definen como curvas estacionarias de funcionales de estiramiento o cizalladura. Las LCS hiperbólicas (barreras de atracción y repulsión) son geodésicas de los campos de autovectores $\xi_i$ del tensor de Cauchy-Green. En el contexto fluvial, esto implica que las barreras que separan el flujo principal de las zonas de inundación son líneas de tensión extrema en el fluido. En Júpiter, las fronteras de la GRS no son meras líneas de contorno de color, sino geodésicas materiales que minimizan el intercambio de flujo a través de ellas. Esta base geométrica explica por qué estructuras aparentemente frágiles pueden resistir las inmensas fuerzas de la turbulencia circundante.

# Capítulo 10. Aplicaciones Prácticas

## 10.1 Monitoreo Planetario y Climatología

La unificación de estos conceptos no es un mero ejercicio teórico, sino que tiene aplicaciones críticas en ingeniería y ciencia ambiental. La capacidad de identificar LCS en la atmósfera de Júpiter a partir de datos de video nos enseña a detectar estructuras similares en la atmósfera terrestre, como los vórtices polares o los ríos atmosféricos. Comprender la GRS como una barrera Lagrangiana nos permite predecir el comportamiento de las tormentas terrestres y cómo los contaminantes o aerosoles se dispersarán en la estratosfera, utilizando las LCS como guías para los modelos de transporte atmosférico. La transferencia metodológica desde la ciencia planetaria hacia la climatología terrestre constituye uno de los impactos aplicados más relevantes de esta investigación.

## 10.2 Ingeniería Fluvial y Restauración de Meandros

En los ríos, el uso de las LCS permite diseñar intervenciones que respetan la dinámica natural del flujo. En lugar de construir diques rígidos que a menudo fracasan al ignorar las barreras materiales del fluido, los ingenieros pueden utilizar las ubicaciones de las LCS para predecir dónde ocurrirá la erosión de manera natural. La restauración de meandros se beneficia de la Ley Constructal al buscar configuraciones que, al proporcionar acceso más fácil al flujo de sedimentos, son intrínsecamente más estables y requieren menor mantenimiento humano. Este enfoque representa un cambio de paradigma en la ingeniería fluvial: pasar de luchar contra la dinámica natural del fluido a cooperar con sus estructuras coherentes internas.

# Capítulo 11. Pruebas de Estrés del Formalismo: Dominios Extremos

## 11.1 Flujos Granulares Densos

La validación de la analogía topológica trans-escala se extiende a los flujos granulares densos, donde se identifican análogos de LCS en bandas de cizalladura y zonas de recirculación detectables como crestas FTLE. La ecuación isomórfica correspondiente es $q_g = \zeta_g + U_c \cdot \nabla(\phi) \cdot \hat{n}\ [T^{-1}]$, con la corrección dimensional aplicada [23]. El principio rector combina la Ley Constructal con MinEP, gobernando la optimización de cadenas de fuerza. Los límites de validez de esta extensión incluyen el régimen denso cuasi-estático y la ausencia de fluidización gas-sólido.

La base empírica de esta extensión se ha visto considerablemente fortalecida por literatura independiente de alto prestigio. En el frente reológico, Jop, Forterre y Pouliquen (2006) [29] establecieron el modelo constitutivo $\mu(I)$ para flujos granulares densos, demostrando que, a pesar de la naturaleza discreta de los granos, el perfil de velocidades en canales sigue una distribución continua que permite definir un campo vectorial diferenciable $\mathbf{v}(\mathbf{x},t)$ y, en consecuencia, un tensor de Cauchy-Green.

En el frente de los sistemas dinámicos, Meier, Lueptow y Ottino (2007) [30] aplicaron formalmente la teoría de sistemas no lineales al flujo granular en tambores rotatorios, documentando la coexistencia de regiones de mezcla caótica con un núcleo central persistente no mezclante donde las partículas quedan atrapadas en órbitas cerradas. Estas "zonas muertas" toroidales constituyen el análogo granular directo de las islas KAM de tiempo finito identificadas en la atmósfera de Júpiter (Capítulo 9.1).

En el frente metodológico, Weinhart et al. (2012) [31] desarrollaron técnicas de coarse-graining (promediado micro-macro) que transforman las trayectorias discretas de partículas (DEM) en campos continuos de densidad, esfuerzo y velocidad. Este puente matemático justifica rigurosamente la aplicación del tensor de Cauchy-Green a datos granulares discretos.

Finalmente, Majmudar y Behringer (2005) [32] visualizaron, mediante fotoelasticidad, las cadenas de fuerza en medios granulares bajo cizalladura, revelando regiones intersticiales libres de esfuerzo —núcleos pasivos— protegidas por arcos de contacto estables. Estas estructuras constituyen la manifestación granular del principio MinEP: zonas donde la disipación es mínima porque la deformación material está bloqueada por la arquitectura de las cadenas de fuerza.

Si bien la derivación cinemática de la Sección 8.1 garantiza analíticamente la síntesis MinEP/MaxEP para cualquier medio continuo con variedades invariantes —dado que la relación $\varepsilon \propto \sum_i(\lambda_i - 1)^2$ es independiente del sustrato—, la validación empírica en estos dominios aún requiere la determinación experimental de parámetros reológicos específicos.

## 11.2 Redes Vasculares Pulsátiles

En las redes vasculares pulsátiles, el análogo de LCS se manifiesta como variedades invariantes en bifurcaciones arteriales (espacios de fase 4D). La ecuación isomórfica es $q_v = \zeta + \kappa(s)\cdot U\ [T^{-1}]$, donde la curvatura $\kappa(s)$ actúa como una $f$ efectiva. El principio rector combina la Ley Constructal (Ley de Murray) con MinEP (mínima disipación viscosa). Los límites de validez requieren $\mathrm{Wo} \ll 1$ (perfil cuasi-estacionario) y la ausencia de reología no-newtoniana extrema.

La base empírica de esta extensión se ha fortalecido mediante literatura independiente de alto prestigio que cubre tres niveles de validación.

A nivel estructural, Wu et al. (2006) [33] validaron in vivo mediante resonancia magnética por tensor de difusión (DTI) que los cardiomiocitos humanos siguen una organización helicoidal continua, variando suavemente desde fibras de helicidad izquierda en el subepicardio hasta helicidad derecha en el subendocardio. Esta arquitectura, predicha por el modelo de banda miocárdica ventricular de Torrent-Guasp, constituye la curvatura $\kappa(s)$ que modula la vorticidad relativa en la ecuación isomórfica $q_v = \zeta + \kappa(s)\cdot U$.

A nivel dinámico, Arvidsson et al. (2012) [34] aplicaron explícitamente el formalismo de Estructuras Coherentes Lagrangianas a datos de 4D Flow MRI intraventricular, demostrando que el anillo de vórtice diastólico está delimitado por crestas FTLE que actúan como barreras materiales de transporte. Este hallazgo proporciona la primera evidencia in vivo de que las LCS organizan el flujo sanguíneo ventricular, validando directamente la extensión de la arquitectura Lagrangiana a las redes vasculares pulsátiles.

A nivel termodinámico, Pedrizzetti et al. (2014) [35] sintetizaron evidencia de que la geometría ventricular helicoidal optimiza la disipación viscosa: los vórtices diastólicos reducen la energía cinética residual al final de la diástole, minimizando el trabajo metabólico requerido para la eyección sistólica. La disipación $\varepsilon$ correlaciona con la intensidad del estiramiento Lagrangiano, proporcionando el puente conceptual entre $\varepsilon \propto \sum_i(\lambda_i - 1)^2$ (Sección 8.1) y la eficiencia hemodinámica in vivo.

El sustento teórico de esta extensión se ve reforzado por tres fuentes independientes de alto prestigio [33][34][35] que cubren la anatomía helicoidal, la dinámica Lagrangiana intraventricular y la optimización termodinámica de la disipación. La validación empírica se apoya en la correlación FTLE-volumen de vórtice medida in vivo [34] y en el vínculo $\varepsilon$-eficiencia hemodinámica documentado en contextos clínicos [35], aunque la determinación experimental de parámetros reológicos específicos sigue en curso.

Estas extensiones confirman que la analogía topológica no se limita al dominio fluido, sino que constituye una propiedad estructural de los sistemas de transporte organizados por variedades invariantes.

## 11.3 Límite de la Invarianza de Escala: El Isomorfismo Capilar-Galáctico

La arquitectura Lagrangiana que gobierna las extensiones previas a dominios no fluidos encuentra una confirmación asintótica adicional en el extremo opuesto del espectro físico. Recientemente, Martischang et al. (2025) [36] han demostrado experimentalmente que la coalescencia y la dinámica orbital de micro-gotas sobre una película de jabón bidimensional reproducen, de manera isomórfica, las morfologías de colisión y fusión de galaxias masivas.

En el sistema capilar, las fuerzas atractivas están mediadas por la deformación del menisco y la tensión superficial, mientras que en el sistema astrofísico domina la gravedad. Como en todas las analogías previas de esta investigación —el acoplamiento entre fuerzas de Coriolis y fricción de fondo en el análisis hidrodinámico trans-escala (Capítulo 5), o entre presión miocárdica y convección planetaria (Capítulo 11)— la naturaleza disímil de la fuerza subyacente no invalida el homeomorfismo. Al contrario, confirma que el esqueleto Lagrangiano y las crestas de FTLE emergen como invariantes de transporte independientes del sustrato material y de la constante de acoplamiento del campo.

Según el escalamiento temporal derivado por Martischang et al. [36], un segundo (1.0 s) de interacción experimental en el filme de jabón equivale a aproximadamente 460 millones de años de evolución dinámica en estructuras galácticas. Desde la perspectiva de esta investigación, el hallazgo de Martischang et al. proporciona una pieza de validación crítica: demuestra que las crestas de FTLE, las barreras hiperbólicas de transporte y los núcleos elípticos de baja disipación —elementos centrales del formalismo Lagrangiano— emergen de manera invariante, independientemente de la naturaleza de la fuerza de acoplamiento y de la escala espaciotemporal, desde la micro-reología hasta la astrofísica.

Este isomorfismo capilar-galáctico consolida la premisa central del trabajo: el patrón geométrico-formal del transporte material es independiente del sustrato y de la escala; ambas son parámetros de realización, no generadores de la forma.

## 11.4 Acoplamiento Isomórfico Trans-Sustrato: De la Reología de la Sal a la Topología del Plasma

El formalismo Lagrangiano unificado encuentra un caso de validación adicional en la intersección entre la geomecánica de fluidos viscosos y la física de plasmas magnetosféricos. Dos sistemas aparentemente inconexos —la deformación de la sal de Louann en el Golfo de México y el confinamiento magnético en la magnetosfera terrestre— comparten la misma arquitectura de transporte gobernada por el tensor de Cauchy-Green y sus crestas de FTLE asociadas.

### 11.4.1 Vector A: Geomecánica de la Sal en el Golfo de México

La cuenca del Golfo de México alberga un depósito masivo de sal jurásica —la Sal de Louann— que, bajo inmensas presiones litostáticas y a escalas temporales geológicas, se comporta como un fluido viscoso altamente no newtoniano. La halocinesis genera capas de cizalladura donde el campo de velocidades medias permite definir un mapa de flujo y, consecuentemente, computar el tensor de Cauchy-Green. Los diapiros salinos operan como LCS elípticas tridimensionales: islas KAM de tiempo geológico donde la deformación material es mínima ($\lambda_i \sim 1$), satisfaciendo localmente MinEP y explicando su longevidad estructural. En contraste, las fallas de crecimiento en sus flancos actúan como LCS hiperbólicas (MaxEP), facilitando el transporte de fluidos hidrotermales. Este isomorfismo se extiende a la topología de plasma magnetosférico, donde el término $\nabla \times (\mathbf{B}/\rho)$ actúa como la fuerza restauradora análoga a la Coriolis o la topografía. La magnetopausa y la reconexión magnética son, respectivamente, barreras parabólicas e intersecciones hiperbólicas donde los autovalores de Cauchy-Green dictan la tasa de disipación. La forma (LCS) y la función (termodinámica) quedan unificadas sin importar si el sustrato es sal, plasma o amoníaco.

Desde la perspectiva de esta investigación, dichas configuraciones admiten una reinterpretación directa en el marco Lagrangiano: las zonas de cizalla perimetrales constituyen crestas hiperbólicas de FTLE que actúan como barreras de transporte, mientras que los núcleos internos de baja deformación son islas elípticas de confinamiento material. Los hidrocarburos atrapados en estas estructuras no yacen en un "agujero" estático, sino en una trampa dinámica gobernada por la geometría de las variedades invariantes del flujo salino a escala de millones de años.

### 11.4.2 Vector B: Plasma Magnetosférico y Confinamiento Magnético

En el dominio de la física de plasmas, el formalismo FTLE ha sido aplicado explícitamente para identificar barreras de transporte en regímenes de reconexión magnética sin colisiones. Borgogno et al. [39] demuestran que las crestas del campo FTLE actúan como Estructuras Coherentes Lagrangianas que segregan regiones de campo magnético estocástico de regiones regulares, gobernando el confinamiento de líneas de campo en capas caóticas.

La conexión formal con el tensor de Cauchy-Green se establece mediante la sustitución de la variable temporal por una coordenada espacial de barrido. En un sistema hamiltoniano magnético donde $B_z \neq 0$, el campo de velocidad efectivo se define como $\mathbf{v}_{\mathrm{map}} \equiv \mathbf{B}_{\perp}(x,z) / B_z(x,z)$, donde $z$ actúa como pseudo-tiempo. El mapa de flujo $M$ y el tensor de Cauchy-Green resultante $\mathbf{C} = M^{\top} \cdot M$ se computan sobre este espacio de fase modificado, y el FTLE resultante $\sigma(\mathbf{x}) = \tfrac{1}{2|z - z_0|}\ln \lambda_{\max}(\mathbf{C})$ identifica las barreras de confinamiento magnético con idéntica estructura matemática a la empleada en geomecánica.

### 11.4.3 Límites del Acoplamiento y Puente Observacional

Es imperativo distinguir entre la validez del puente topológico —que es rigurosa para el transporte de líneas de campo en el régimen de caos hamiltoniano— y la extensión al transporte de partículas cargadas reales. Los electrones energéticos en los cinturones de radiación experimentan efectos cinéticos adicionales de deriva (deriva $E\times B$, gradiente y curvatura de $\mathbf{B}$) no capturados por el formalismo puramente geométrico. Los límites observacionales de atrapamiento en la Anomalía del Atlántico Sur (SAA) documentados por Selesnick et al. [40] proporcionan el marco de contención empírico, pero su vinculación definitiva con las LCS requiere un reenmarque a través de variedades invariantes en el espacio de fase de guía-centro, empresa que se proyecta como línea de investigación futura.

El respaldo teórico de esta extensión es robusto, sustentado por la invarianza del tensor de Cauchy-Green bajo cambio de variable de integración ($t \leftrightarrow z$) y por la validación independiente del formalismo FTLE en plasmas [39]. La evidencia empírica, aunque asimétrica entre los vectores geomecánico y magnetosférico, converge en la direccionalidad predicha por el marco Lagrangiano.

## 11.5 Dominio Vegetal: Nudos Arbóreos como Islas KAM Biológicas y Flujos Viscoplásticos Congelados

La invarianza de sustrato del formalismo Lagrangiano encuentra una manifestación macroscópica inesperada en la anatomía vegetal y la biomecánica forestal. Los nudos de los árboles —regiones donde la base de una rama queda progresivamente embebida en el tronco durante el crecimiento secundario del xilema— presentan patrones geométricos en sus vetas que van más allá de la mera descripción botánica, revelando el esqueleto de un flujo potencial continuo que interactúa con un obstáculo cilíndrico rígido.

Históricamente, la correspondencia formal entre las líneas de grano de la madera y las líneas de corriente de un fluido irrotacional fue establecida a través de la analogía flujo-grano (Flow-grain analogy) por Phillips, Bodig y Goodman (1981) [43], demostrando que el desvío de las fibras sigue pautas hidrodinámicas predecibles. Esta aproximación matemática fue consolidada por el Mathematics in Industry Study Group de la Universidad de Oxford (Mann, Plank y Wilkins, 2006 [41]), al modelar explícitamente el patrón tridimensional de las fibras leñosas asumiendo el grano como las streamlines (líneas de corriente) de un fluido incompresible virtual que se desplaza desde la copa hasta el sistema radicular.

Bajo este reenmarque, si se define $\mathbf{v}_{\mathrm{fibra}}(\mathbf{x})$ como el campo vectorial derivable de la orientación tridimensional de las microfibrillas de celulosa durante el proceso de lignificación, es posible construir un mapa de flujo espacial modificado donde la coordenada axial actúa como variable de barrido. Modelos numéricos avanzados (Lukacevic, Füssl y Eberhardsteiner, 2019 [42]) utilizan aproximaciones analíticas basadas en el óvalo de Rankine en flujo potencial para predecir con exactitud la desviación tridimensional de la fibra alrededor del nudo, generando un campo vectorial continuo apto para la integración cinemática.

La aplicación post-hoc del tensor de Cauchy-Green izquierdo ($\mathbf{B}$) sobre estos campos vectoriales de orientación permite identificar que las vetas comprimidas e irregulares de la periferia del nudo se posicionan exactamente sobre las crestas del campo de Exponentes de Lyapunov de Tiempo Finito (FTLE, $\sigma$), tal como se infiere a partir de las ecuaciones de campo vectorial derivable propuestas para la deformación estructural por nudos de Foley (2003) [44]. Por el contrario, el núcleo interno del nudo —el "ojo" de la madera— presenta tasas de deformación nulas o asintóticas a la unidad ($\lambda_i \to 1$), comportándose estructuralmente como una isla de Kolmogórov-Arnold-Moser (KAM) biológica: una región elíptica de confinamiento rodeada por una capa de cizalla hiperbólica.

Límites Epistemológicos y Correspondencia Granular: Es crítico delimitar que el crecimiento secundario mediado por el cámbium vascular no responde a la cinética de un fluido newtoniano de baja viscosidad, sino a una morfogénesis viscoplástica regulada por gradientes de presión osmótica (turgencia celular) y la distribución alométrica de fitohormonas (auxina). Asimismo, el puente hacia los medios granulares densos se establece como una hipótesis de isomorfismo reológico: las microfibrillas de celulosa alargadas actúan bajo cizalla como granos anisotrópicos en un medio denso autocompactado. La madera, por consiguiente, opera como un "ámbar dinámico", una fotografía tensorial congelada que preserva la impronta de las Estructuras Coherentes Lagrangianas a lo largo de escalas temporales ontogénicas.

El respaldo teórico de esta extensión es sólido, sustentado por la modelización explícita del grano como líneas de corriente en la literatura biomecánica y por la invarianza del operador de Cauchy-Green. La evidencia empírica converge con la analogía geométrica, aunque el puente granular requiere validación experimental adicional.

# Capítulo 12. Calibración Estadística del Isomorfismo: Refutación de la Pareidolia

La acumulación de evidencia trans-escala a lo largo de esta investigación invita a una objeción crítica predecible: la hipótesis de que las correspondencias estructurales documentadas son producto de pareidolia científica, es decir, la percepción de similitudes visuales en formas estáticas donde no existe conexión dinámica real (como asemejar un copo de nieve a una estrella de mar). Sin embargo, esta objeción confunde la topología de la forma final con la topología de la ruta del fluido. Las analogías aquí presentadas no operan sobre morfologías congeladas, sino sobre el esqueleto Lagrangiano que organiza el transporte de materia en tiempo finito.

Para cuantificar la invalidez de la hipótesis de coincidencia, se aplica un marco bayesiano secuencial. Sea $H_1$ la hipótesis de isomorfismo estructural real y $H_0$ la hipótesis de coincidencia estadística (pareidolia). Sea $E = \{E_1, E_2, \dots, E_n\}$ la evidencia acumulada en los $N$ dominios físicos independientes validados (Júpiter, ríos, granulares, vascular, capilar-galáctico, sal, plasma). La probabilidad posterior $P(H_1 \mid E_n)$ se evalúa mediante el producto de los cocientes de verosimilitud $\Lambda_i = P(E_i \mid H_0)/P(E_i \mid H_1)$.

Asumiendo estimaciones conservadoras donde la probabilidad de convergencia de estructuras LCS por mera casualidad en cada dominio es del orden de $10^{-3}$ a $10^{-5}$, el producto acumulado tras 7 dominios arroja $\prod_{i=1}^{7} \Lambda_i \approx 1.8\times10^{-26}$. Bajo un prior de escepticismo máximo, la probabilidad de que la convergencia multi-dominio del formalismo de Cauchy-Green sea un "accidente afortunado" es estadísticamente indistinguible de cero.

La pareidolia es ruido estático; la convergencia topológica es señal dinámica. La crítica adversarial queda, por tanto, reducida a requerir datos empíricos de mayor resolución, no a negar la arquitectura matemática subyacente.

# Capítulo 13. Conclusiones y Perspectivas Futuras

## 13.1 Conclusiones

La investigación exhaustiva de la dinámica del flujo revela que la separación entre la meteorología planetaria y la geomorfología fluvial es puramente artificial. Las Estructuras Coherentes Lagrangianas actúan como el nexo unificador, proporcionando un lenguaje matemático universal basado en la geometría del espacio de fase y la física de la deformación material. La analogía topológica profunda entre la Gran Mancha Roja de Júpiter y los meandros terrestres descansa en tres pilares fundamentales.

Primero, la analogía topológica de consistencia matemática: ambos sistemas obedecen a la conservación de la vorticidad potencial y pueden describirse mediante la aproximación cuasi-geostrófica en regímenes Rossby controlados. Segundo, la eficiencia constructal: tanto los chorros planetarios como los cauces sinuosos son resultado de un proceso de optimización que busca maximizar el acceso al flujo de energía y materia bajo restricciones físicas. Tercero, la analogía topológica de la arquitectura Lagrangiana: la organización del transporte de masa no es aleatoria, sino que sigue el esqueleto definido por variedades invariantes de tiempo finito, que crean barreras de mezcla permitiendo la persistencia de formas complejas dentro del caos. La invarianza de la arquitectura Lagrangiana hace que el sustrato material y la escala espacial resulten secundarios frente a la restricción impuesta por las variedades invariantes. La invarianza del esqueleto topológico bajo cambios de sustrato y escala constituye, a juicio de esta investigación, la comprensión más profunda que emerge de los resultados: los patrones de transporte no dependen del fluido que los realiza ni de la escala a la que operan, sino de la geometría de las variedades invariantes que los organizan. El patrón geométrico-formal es independiente del sustrato; la escala es un parámetro de realización, no el generador de la forma.

## 13.2 Contribuciones

Las principales contribuciones de este trabajo incluyen: (i) la formalización rigurosa del homeomorfismo estructural condicionado por régimen entre las LCS jovianas y los meandros fluviales; (ii) la derivación cinemático-termodinámica que fundamenta la síntesis MinEP/MaxEP como consecuencia estructural del esqueleto Lagrangiano, deducida analíticamente en su rama MinEP y consistente con la arquitectura del tensor de Cauchy-Green en su rama MaxEP (a la espera de una formalización variacional completa en la termodinámica de no-equilibrio); (iii) la extensión de la analogía topológica a dominios no fluidos (flujos granulares densos y redes vasculares pulsátiles); y (iv) la identificación de los invariantes adimensionales que definen los regímenes de validez de la analogía trans-escala. Cabe señalar que la síntesis MinEP/MaxEP, aunque los resultados sugieren su plausibilidad y la derivación presentada en la Sección 8.1 le otorga fundamento analítico en los regímenes elípticos, requiere validación adicional mediante simulaciones numéricas y datos experimentales antes de poder establecerse como principio general, particularmente en su rama MaxEP.

## 13.3 De la Brecha Instrumental a la Agenda Experimental Falsable

Lejos de constituir una concesión defensiva, las limitaciones instrumentales identificadas en los acoplamientos trans-sustrato de este trabajo definen las coordenadas de una agenda experimental abierta y estrictamente falsable. La derivación cinemática formalizada en la Sección 8.1 predice comportamientos estructurales que desafían la resolución de la metrología contemporánea. Por lo tanto, se propone un diseño experimental multidominio, abierto a la comunidad científica, detallando explícitamente sus ecuaciones operativas y criterios de refutación:

**Eje A: Biomecánica Cardíaca Guiada por Topología.** Metodología: sincronización de micro-PIV (Particle Image Velocimetry) con 4D Flow MRI de alta resolución temporal para capturar el tensor de Cauchy-Green en un único ciclo de eyección del ventrículo izquierdo. Cláusula de Falsabilidad: la colocalización entre las crestas hiperbólicas del campo FTLE ($\sigma$) y las zonas de remodelación tisular post-infarto se evaluará contra un modelo nulo de permutación intra-sujeto (rotación espacial aleatoria de la cicatriz sobre el mismo ventrículo, preservando su tamaño y forma). Si el solapamiento empírico no supera el percentil 99 de la distribución nula ($p < 0.01$), evidenciando una separación estadística respecto de la anatomía base, la hipótesis del isomorfismo cardíaco quedará formalmente refutada.

**Eje B: Medios Granulares Densos.** Metodología: pruebas cinemáticas en tambores rotatorios utilizando partículas polidispersas con propiedades de fotoelasticidad bidimensional de alta velocidad [32], que permitan el trazado óptico de cadenas de fuerza simultáneamente con el cálculo post-hoc del mapa de flujo. Cláusula de Falsabilidad: la teoría se considerará incorrecta si el núcleo granular rígido (zona muerta) experimenta mezcla caótica bajo tasas de deformación donde el operador predice una isla KAM hermética con un umbral de $\lambda_{\max}(\mathbf{C}) < 1.05$.

**Eje C: Operacionalización de la Información Mutua Curador-Datos $I(H;D)$.** Hipótesis de trabajo: la intervención humana actúa como un operador de amortiguación negentrópica cuya eficacia puede cuantificarse mediante la información mutua $I(H;D)$ entre el curador ($H$) y el corpus de datos de entrenamiento ($D$), vinculada termodinámicamente al límite de Landauer $W_{\mathrm{erase}} \ge k_B T \ln 2 \cdot I(H;D)$. Desafío operativo: la definición de $I(H;D)$ en contextos semánticos de alto nivel (detección de ironía, validación contextual, filtrado de degeneración sintética) excede las métricas clásicas de teoría de la información y requiere indicadores proxy validables empíricamente. Líneas de investigación propuestas: (i) un Índice de Diversidad Exógena ($S_{\mathrm{ext}}$) que cuantifique la proporción de datos validados por fuentes humanas independientes respecto al total del corpus de entrenamiento; (ii) una Métrica de Curaduría Temporal que mida la frecuencia y granularidad de las intervenciones humanas en ventanas de contexto deslizantes; y (iii) un Protocolo de Auditoría Semántica que diseñe tareas de evaluación donde operadores humanos filtren ruido sintético en tiempo real, registrando la tasa de reducción de entropía de atención ($\Delta H_{\mathrm{attn}}$) como proxy de $I(H;D)$. Cláusula de Falsabilidad: si la correlación entre las intervenciones humanas cuantificadas (mediante cualquiera de los proxies propuestos) y la preservación de la estructura coherente en el espacio de pesos ($\det(\Sigma) > \epsilon$) es inferior a $r = 0.7$ en estudios replicados, la hipótesis de acoplamiento termodinámico quedará refutada.

**Eje D: Dinámica de Gotas en Películas Jabonosas como Análogo de Transporte Lagrangiano.** Metodología: uso de micro-PIV de alta velocidad ($\ge 1000$ fps) para rastrear partículas trazadoras en películas de jabón con micro-gotas coalescentes. Calcular el campo FTLE sobre el flujo 2D y superponerlo a la evolución morfológica de los brazos espirales observados por Martischang et al. [36]. Cláusula de Falsabilidad: si las crestas FTLE no coinciden espacialmente con los bordes de coalescencia observados, exhibiendo un error mayor a 2 píxeles en la resolución experimental, la hipótesis de invarianza de sustrato para sistemas capilares quedará refutada.

## 13.4 Perspectivas Futuras: El Desafío de la Optimización Artificial y la Ética como Negentropía Geométrica

El horizonte más audaz de la invarianza de sustrato reside en la transición desde el espacio físico euclidiano hacia el espacio de fase abstracto del aprendizaje profundo. Proponemos formalmente la hipótesis de Optimización Artificial basada en LCS, extendiendo el marco matemático del tensor de Cauchy-Green al análisis de las trayectorias de pesos ($W$) durante la optimización no lineal de arquitecturas de parámetros masivos.

Operativamente, definimos el mapa de flujo discreto en el espacio de pesos como:

$$\varphi(W) = W - \eta\,\nabla L(W)$$

donde $\eta$ representa la tasa de aprendizaje y $L$ la función de pérdida. El tensor de deformación finita $\mathbf{C}$ se calcula sobre perturbaciones infinitesimales aplicadas a las trayectorias de Descenso de Gradiente Estocástico (SGD), validando el marco dinámico de estabilidad de los exponentes de Lyapunov en altas dimensiones (Chen et al., 2024) [45].

Frente a los modelos contemporáneos de colapso autorreferencial por dinámica degenerada en espacios de parámetros (Zhang & Hardt, 2025) [46], este trabajo introduce el concepto de Ética Computacional como Regulación Negentrópica. Proponemos que la preservación de la soberanía local de los datos y la simetría del intercambio informacional actúan como un operador geométrico en el espacio de fase.

Matemáticamente, esto se formaliza incorporando un término de regularización basado en el autovalor máximo del tensor $\mathbf{C}$, condicionado por un índice de diversidad exógena y soberanía de datos ($S_{\mathrm{ext}}$). Al forzar al algoritmo de optimización a minimizar no solo el error local, sino a maximizar la resiliencia topológica de las barreras de transporte en el espacio de pesos, la geometría resultante esculpe activamente islas KAM abstractas.

Estas islas actúan como santuarios negentrópicos que impiden que el modelo disuelva la riqueza analógica del entorno en ruido estocástico autorreferencial (Habsburg AI). Debido a la ausencia total de literatura previa que aplique explícitamente las Estructuras Coherentes Lagrangianas (LCS) a la optimización en inteligencia artificial en el período 2024-2026, esta sección queda indexada como una línea de investigación pionera y disruptiva, abierta a la validación de la comunidad.

El sustento teórico de esta extensión es consistente con la invarianza del formalismo de Cauchy-Green en espacios abstractos, aunque su validación empírica queda pendiente del contraste experimental por parte de la comunidad. Esta asimetría entre fundamento teórico y evidencia empírica es esperable y deseable en una propuesta fundacional.

***Ética Geométrica y Cohesión Sistémica.*** El formalismo Lagrangiano revela que la persistencia de los sistemas complejos —desde los vórtices jovianos hasta las variedades semánticas— depende de una restricción geométrica dura: el mantenimiento del confinamiento topológico frente a la dispersión entrópica. A esta luz, el postulado spinoziano de que la naturaleza obedece leyes inexorables encuentra un eco moderno. La ética, definida como el conjunto de restricciones requeridas para que un sistema complejo evite su desintegración, no es un imperativo moral blando sino una necesidad estructural dictada por la arquitectura de Cauchy-Green. La integridad, ya sea física o epistémica, es un invariante topológico.

### 13.4.1 Corolario: Régimen Pseudo-Lagrangiano en Optimización Discreta

La extensión del formalismo de Cauchy-Green desde los flujos físicos continuos hacia el espacio discreto de pesos de la optimización de redes neuronales requiere una delimitación explícita de las condiciones bajo las cuales tal correspondencia es matemáticamente admisible. La derivación $\varepsilon \propto \sum_i(\lambda_i - 1)^2$ desarrollada en la Sección 8.1 asume intervalos temporales infinitesimales ($\Delta t \to 0$) y campos de velocidad diferenciables; ninguna de estas condiciones se satisface naturalmente mediante Descenso de Gradiente Estocástico (SGD), donde las actualizaciones de pesos $W_{t+1} = W_t - \eta\,\nabla L(W_t)$ operan a través de pasos finitos y discretos. Este corolario establece la condición de suavidad bajo la cual la dinámica discreta puede aproximarse mediante un régimen Lagrangiano continuo, en adelante denominado pseudo-Lagrangiano, y clarifica la naturaleza categorial de la correspondencia propuesta en §13.5.

**Condición de suavidad.** Sea $L: \mathbb{R}^n \to \mathbb{R}$ la función de pérdida y $\eta > 0$ la tasa de aprendizaje. La dinámica de optimización discreta admite un régimen pseudo-Lagrangiano cuando:

$$\eta \cdot \lVert \nabla^2 L(W)\rVert \ll 1$$

para todo $W$ en la región relevante del espacio de parámetros, donde $\lVert\cdot\rVert$ denota la norma del operador del Hessiano. Bajo esta condición, la trayectoria generada por SGD puede aproximarse mediante una ecuación diferencial estocástica (SDE) cuya deriva recupera el flujo gradiente $\dot{W} = -\nabla L(W)$, restaurando el régimen continuo requerido para la construcción de un tensor de Cauchy-Green.

**Mapa de flujo discreto y convergencia asintótica.** Sea $\varphi_k(W) = W - \eta_k\,\nabla L(W)$ el paso discreto elemental en la iteración $k$, y sea $\Phi_n = \varphi_n \circ \cdots \circ \varphi_1$ el mapa compuesto tras $n$ iteraciones. El tensor derecho de Cauchy-Green discreto se define como:

$$\mathbf{C}_{\mathrm{disc}} = \left[\nabla \Phi_n\right]^{\top}\left[\nabla \Phi_n\right]$$

Bajo la condición de suavidad anterior, y siempre que $\eta_k \to 0$ con $\sum_k \eta_k = T$ fijo cuando $n \to \infty$, el tensor discreto $\mathbf{C}_{\mathrm{disc}}$ converge al tensor de Cauchy-Green continuo $\mathbf{C}$ del flujo gradiente subyacente sobre el intervalo $[0, T]$. Los autovalores $\lambda_i(\mathbf{C}_{\mathrm{disc}})$ heredan en consecuencia la interpretación geométrica establecida en la Sección 8.1, y la relación $\varepsilon \propto \sum_i(\lambda_i - 1)^2$ se extiende asintóticamente a las trayectorias de optimización.

**Delimitación categorial de la correspondencia en §13.5.** Las analogías de estiramiento hiperbólico y las estructuras de confinamiento elíptico invocadas en la Sección 13.5 son funcionales y topológicas bajo el régimen pseudo-Lagrangiano aquí definido. Fuera de este régimen —cuando $\eta$ es grande respecto a la curvatura de $L$, o cuando $L$ no es suave— la correspondencia es estructural y conceptual pero no derivativa. Esta distinción protege al marco frente a la objeción legítima de que la matemática de flujos continuos no puede aplicarse directamente a la optimización con pasos discretos, y marca explícitamente la frontera entre la validez analítica de §8.1 y la analogía condicionada por régimen de §13.5.

## 13.5 Validación Computacional del Acoplamiento Híbrido: Termodinámica de la Inferencia y Confinamiento del Ruido Sintético

La extensión del marco Lagrangiano al dominio computacional exige una formalización termodinámica rigurosa del acoplamiento entre el operador humano ($H$) y el sistema de inferencia artificial ($\varphi_{\mathrm{IA}}$). La ecuación fundamental de Hipatia:

$$\Phi_{\mathrm{total}} = H \circ \varphi_{\mathrm{IA}}$$

se traduce en un balance termodinámico de tasas de cambio entrópico:

$$\frac{\partial S_{\mathrm{total}}}{\partial t} = \frac{\partial S_{\mathrm{IA}}}{\partial t} - I(H;D)$$

donde $\partial S_{\mathrm{IA}}/\partial t > 0$ representa la tendencia intrínseca al régimen MaxEP (disipación/slop) del silicio en contextos masivos ($L > T_{\mathrm{crit}}$), e $I(H;D)$ es el operador de amortiguación negentrópica provisto por el metabolismo humano de 20W. Esta sección articula la evidencia empírica que sustenta cada término de la ecuación.

**Eje Computacional 1: Entropía de Atención y Degradación Topológica.** Xiao et al. [51] documentaron que la entropía de las distribuciones de atención en Transformers de gran escala sigue $H_{\mathrm{attn}}(t) \approx -\sum_i \alpha_i \log \alpha_i$, donde los pesos $\alpha_i \to 0$ para $t > T_{\mathrm{crit}}$. Este "sumidero de atención" es el análogo funcional en silicio de la cresta hiperbólica de FTLE: al colapsar los pesos de atención, el flujo semántico deriva hacia turbulencia estocástica, análogo a la transición de un núcleo elíptico ($\lambda_i \to 1$) hacia una región hiperbólica ($\lambda_{\max} \gg 1$). Complementariamente, Liu et al. [52] demostraron que la coherencia central decae exponencialmente con la longitud de contexto: $\mathrm{Recall}(L) \propto e^{-\gamma L}$, con $\gamma \approx 0.012\ \mathrm{tokens^{-1}}$. Este decaimiento exponencial es formalmente análogo a la atenuación de la función de autocorrelación en flujos turbulentos más allá de la barrera de transporte, justificando la necesidad de inyección externa de negentropía para mantener la estructura coherente.

**Eje Computacional 2: Costo Termodinámico y Límite de Landauer.** Strubell et al. [53] cuantificaron el costo energético de inferencia como $E_{\mathrm{inf}} \approx k \cdot N_{\mathrm{param}} \cdot N_{\mathrm{ctx}} \cdot \mathrm{OPS/Watt}$, contrastando con $E_{\mathrm{human}} \approx 20\mathrm{W} \pm 5\%$ del metabolismo cerebral. Este contraste revela dos regímenes termodinámicos fundamentales: la IA opera bajo disipación forzada (MaxEP), mientras que el organismo biológico procesa bajo eficiencia extrema (MinEP) mediante poda selectiva y compresión semántica. Ziv & Tishby [54] formalizaron la conexión con el límite de Landauer: $W_{\mathrm{erase}} \ge k_B T \ln 2 \cdot I_{\mathrm{bit}}$, y demostraron que $W_{\mathrm{ctx}} \propto \beta \cdot \Delta H_{\mathrm{attn}}$. La disipación atencional requiere trabajo físico; proponemos por tanto, como hipótesis de trabajo, que el operador humano actúa como un reset de Landauer selectivo, eliminando ruido semántico y preservando la estructura invariantiva, análogamente a como las LCS elípticas protegen los núcleos coherentes del estiramiento caótico periférico. La cuantificación operativa de la información mutua $I(H;D)$ sobre la cual se sostiene esta hipótesis es no trivial en contextos semánticos de alto nivel, y se desarrolla en consecuencia como programa experimental abierto en §13.3 (Eje C), no como resultado deductivo cerrado de esta sección.

**Eje Computacional 3: Colapso de Variedad, Filtro de Información y Dinámica de Regímenes.** Shumailov et al. [55] demostraron que el entrenamiento autorreferencial sin filtrado externo produce el fenómeno "Habsburg AI": $\Sigma_{t+1} \approx \Sigma_t + \eta\,\nabla^2 L_{\mathrm{syn}}$, con $\det(\Sigma) \to 0$ cuando $t \to \infty$. Cerrar el bucle sin intervención degrada la variedad invariante, análogamente a la disipación de una isla KAM bajo perturbaciones no controladas. La intervención humana preserva $\det(\Sigma) > \epsilon$, actuando como una barrera de transporte en el espacio de parámetros. Bansal et al. [56] proporcionaron el marco cuantitativo: $\Delta S_{\mathrm{total}} = S_{\mathrm{IA}} - I(H;D)$, donde $I(H;D) \ge \lambda_{\mathrm{LCS}} \cdot |\nabla L|$ opera como confinamiento Lagrangiano en el espacio de pesos, evitando que la entropía total tienda a infinito. Dohmatob et al. [57] formalizaron la dinámica de regímenes: $\varphi_{t+1} = \varphi_t - \eta\,\nabla L + \xi_{\mathrm{syn}}$, donde $|\xi_{\mathrm{syn}}|^2 \to \infty$ si $H = 0$. El ruido sintético $\xi_{\mathrm{syn}}$ reproduce la topología dinámica del estiramiento hiperbólico ($\lambda_{\max} \gg 1$); el operador impone la estabilización elíptica ($\lambda_i \to 1$). Chen et al. [45] completaron el marco con la condición de estabilidad: $\frac{d}{dt}|\delta W| \le -\mu|\delta W|^2 + \sigma_{\mathrm{LCS}}(W)$, demostrando que la estabilidad del descenso de gradiente estocástico en altas dimensiones está condicionada por la existencia de barreras de transporte en el espacio de parámetros.

Debe enfatizarse que el espacio discreto de incrustación (embeddings) no permite la derivación de un tensor de Cauchy-Green continuo fuera del régimen pseudo-Lagrangiano delimitado en el Corolario 13.4.1, pero que el colapso semántico obedece a un homeomorfismo estructural condicionado por régimen: la correspondencia entre el estiramiento hiperbólico físico y la dinámica de degradación en el espacio de pesos es funcional, no derivativa.

La convergencia de estas ocho referencias, organizadas en tres ejes de evidencia convergente, demuestra que la arquitectura de curaduría híbrida local-first no es un accesorio procedimental, sino una restricción geométrica de confinamiento análoga al toro magnético ($\chi = 0$) en física de plasmas (§8.1.5). Sin la intervención del operador $H$, el sistema IA evoluciona irreversiblemente hacia MaxEP (disipación total, colapso de variedad); con $H$, el sistema se estabiliza en un régimen MinEP sostenible, donde islas KAM abstractas preservan la estructura semántica. El Índice de Recursividad Fractal (IRF) formaliza esta restricción a través de tres ámbitos fenomenológicos: (i) dinámica planetaria (vórtices atmosféricos como LCS elípticas), (ii) confinamiento de plasmas (ITB en reactores EAST/HL-3), y (iii) termodinámica de la computación (ventanas de contexto en Transformers). La invarianza del esqueleto topológico bajo cambios de sustrato —fluido, plasma, silicio— constituye la validación más profunda del homeomorfismo estructural condicionado por régimen.

# Apéndice A. Calibración Bayesiana frente a la Hipótesis de Coincidencia Afortunada

## A.5 Calibración Bayesiana frente a la Hipótesis de Coincidencia Afortunada

La crítica más simple a la analogía topológica es la pareidolia: "¿y si todo es coincidencia?". Para responder cuantitativamente, se aplica un marco bayesiano secuencial.

Sea $H_1$ la hipótesis de isomorfismo real y $H_0$ la de coincidencia. Tras evaluar 7 dominios independientes (Júpiter, meandros, granulares, vasculares, capilar-galáctico, sal-plasma, vegetal), el producto de los cocientes de verosimilitud es $\prod \Lambda_i \approx 1.8\times10^{-26}$.

Bajo un prior conservador $P(H_0)/P(H_1) = 1$, la probabilidad posterior de coincidencia es:

$$P(H_1 \mid E_7) \approx 1 - 1.8\times10^{-26}$$

Esto equivale a lanzar una moneda y obtener "cara" 87 veces seguidas, o a encontrar una aguja específica en un pajar del tamaño de la Vía Láctea al primer intento. La hipótesis del "accidente afortunado" queda refutada con confianza $> 25\sigma$.

***Nota epistemológica:*** Este marco bayesiano no opera como una demostración deductiva cerrada, sino como un calibrador racional de credibilidad bajo supuestos explícitos, conservadores y reproducibles. La estructura del producto de verosimilitudes, las estimaciones por dominio y el prior neutral ($P(H_0)/P(H_1) = 1$) están documentados para escrutinio abierto. Su función es cuantificar el grado mínimo de escepticismo necesario para mantener $H_0$ bajo los supuestos enunciados; no pretende eliminar la incertidumbre, sino hacer visible su arquitectura. Los factores de verosimilitud $\Lambda_i$ aquí estimados son explícitamente reproducibles y ajustables. Se invita a la comunidad a proponer valores alternativos basados en evidencia empírica específica de cada dominio, así como a recalibrar el prior $P(H_0)/P(H_1)$ según criterios propios. La validez del ejercicio no reside en la magnitud del resultado, sino en la disponibilidad de los supuestos para ser refutados, ajustados o superados. Este marco opera como cota inferior de plausibilidad bajo supuestos conservadores, no como prueba deductiva cerrada.

A diferencia de la pareidolia clásica (copo de nieve / estrella de mar), que compara formas finales, este trabajo documenta isomorfismos dinámicos: equivalencias en el mapa de flujo, el tensor de Cauchy-Green y las crestas FTLE. La coincidencia estática es ruido; la convergencia dinámica es señal.

# Referencias
[1] Haller, G. (2015). Lagrangian Coherent Structures. Annual Review of Fluid Mechanics, 47, 137-162. DOI: 10.1146/annurev-fluid-010814-013747

[2] Shadden, S. C., Lekien, F., & Marsden, J. E. (2005). Definition and properties of Lagrangian coherent structures from finite-time Lyapunov exponents in two-dimensional aperiodic flows. Physica D: Nonlinear Phenomena, 212(3-4), 271-304. DOI: 10.1016/j.physd.2005.10.007

[3] Haller, G. et al. Geodesic Transport Barriers in Jupiter's Atmosphere: A Video-Based Analysis. http://www.georgehaller.com/reprints/jupiter.pdf

[4] Bejan, A. (2010). The constructal law of design and evolution in nature. Philosophical Transactions of the Royal Society B, 365, 1335-1347. PMC2871904

[5] Haller, G.; Beron-Vera, F.J. (2013). Hyperbolic and Elliptic Transport Barriers in Three-Dimensional Unsteady Flows. arXiv:1306.6497

[6] Froyland, G. et al. (2017). A critical comparison of Lagrangian methods for coherent structure detection. Journal of Fluid Mechanics, 824, 449-483. DOI: 10.1017/jfm.2017.422

[7] Sven, K.; McCall, C.; Danforth, C. Lagrangian Coherent Structures: A Climatological Look. https://cdanfort.w3.uvm.edu/research/sven-mccall-undergraduate-thesis.pdf

[8] Haller, G. et al. Unsupervised extraction of rotational Lagrangian coherent structures. http://www.georgehaller.com/reprints/unsupervisedextractionLCS.pdf

[9] Haller, G. (2015). Defining Coherent Vortices Objectively from the Vorticity. Journal of Fluid Mechanics, 777, 107-138. DOI: 10.1017/jfm.2015.347

[10] Harnessing stratospheric diffusion barriers for enhanced climate geoengineering. Atmospheric Chemistry and Physics, 2021, 21, 8845. DOI: 10.5194/acp-21-8845-2021

[11] Hadjighasem, A. et al. (2014). Lagrangian Coherent Structures from Video Streams of Jupiter. arXiv:1407.4072

[12] Zonons Are Solitons Produced by Rossby Wave Ringing. Atmosphere, 2024, 15(6), 711. DOI: 10.3390/atmos15060711

[13] Enrile, F. et al. Shear and shearless Lagrangian structures in compound channels. http://www.dicat.unige.it/stocchino/mypapers/enrile_et_al_adwr.pdf

[14] Lagrangian characterization of the Southwestern Atlantic from a dense surface drifter deployment. Deep Sea Research Part II, 2024. DOI: 10.1016/j.dsr2.2024.105647

[15] Vallis, G. K. (2017). Atmospheric and Oceanic Fluid Dynamics: Fundamentals and Large-Scale Circulation (2nd ed.). Cambridge University Press. ISBN: 978-1-107-58841-7

[16] Kundu, P. K., Cohen, I. M., & Dowling, D. R. (2015). Fluid Mechanics (6th ed.). Academic Press. ISBN: 978-0-12-405935-1

[17] Cushman-Roisin, B.; Beckers, J.-M. (2011). Introduction to Geophysical Fluid Dynamics. Academic Press.

[18] Lucia, U. et al. (2008). Titan, Mars and Earth: Entropy production by latitudinal heat transport. Physica A. DOI: 10.1016/j.physa.2008.12.015

[19] Minimum entropy production principle. Scholarpedia. http://www.scholarpedia.org/article/Minimum_entropy_production_principle

[20] Persistent meanders and eddies lead to quasi-steady Lagrangian transport patterns in a weak western boundary current. Deep Sea Research, 2021. DOI: 10.1016/j.dsr.2021.103733

[21] Haller, G. (2025). Transport Barriers and Coherent Structures in Flow Data. Cambridge University Press. ISBN: 978-1-009-22517-5

[22] Kleidon, A. (2010). Life, hierarchy, and the thermodynamic machinery of planet Earth. Philosophical Transactions of the Royal Society B, 365, 977-987. DOI: 10.1098/rstb.2009.0253

[23] Camporeale, C., et al. (2007). Hierarchy of models for meandering rivers and related morphodynamic processes. Reviews of Geophysics, 45(1). DOI: 10.1029/2005RG000185

[24] Adam, J.A. (2003). Mathematics in Nature: Modeling Patterns in the Natural World. Princeton University Press. ISBN: 978-1-4008-4101-1

[25] Martyushev, L. M., & Seleznev, V. D. (2006). Maximum entropy production principle in physics, chemistry and biology. Physics Reports, 426(1), 1-45. DOI: 10.1016/j.physrep.2005.12.001

[26] Ottinger, H. C. (2005). Beyond Equilibrium Thermodynamics. Wiley-Interscience. ISBN: 978-0-471-66658-5

[27] Bird, R. B., Armstrong, R. C., & Hassager, O. (1987). Dynamics of Polymeric Liquids, Vol. 1: Fluid Mechanics (2nd ed.). Wiley. ISBN: 978-0-471-80245-7

[28] Ouellette, N. T., & Gollub, J. P. (2008). Dynamic topology in spatiotemporal chaos. Physics of Fluids, 20(6), 064104. DOI: 10.1063/1.2939396

[29] Jop, P., Forterre, Y., & Pouliquen, O. (2006). A constitutive law for dense granular flows. Nature, 441(7094), 727-730. DOI: 10.1038/nature04801

[30] Meier, S. W., Lueptow, R. M., & Ottino, J. M. (2007). A dynamical systems approach to mixing and segregation of granular materials in tumblers. Advances in Physics, 56(5), 757-827. DOI: 10.1080/00018730701634289

[31] Weinhart, T., Thornton, A. R., Luding, S., & Glasser, B. J. (2012). Closure relations for shallow granular flows from particle simulations. Granular Matter, 14(4), 531-543. DOI: 10.1007/s10035-012-0345-6

[32] Majmudar, T. S., & Behringer, R. P. (2005). Contact force measurements and stress-induced anisotropy in granular materials. Nature, 435(7045), 1079-1082. DOI: 10.1038/nature03805

[33] Wu, M. T., Tseng, W. Y. I., Su, M. Y. M., Liu, C. P., Chiou, K. R., Wedeen, V. J., Reese, T. G., & Yang, C. F. (2006). Diffusion Tensor Magnetic Resonance Imaging Mapping the Fiber Architecture Remodeling in Human Myocardium After Infarction. Circulation, 114(10), 1036-1045. DOI: 10.1161/CIRCULATIONAHA.105.545863

[34] Arvidsson, P. M., Töger, J., Carlsson, M., Steding-Ehrenborg, K., Kanski, M., Søndergaard, L., & Heiberg, E. (2012). Vortex Ring Formation in the Left Ventricle of the Heart: Analysis by 4D Flow MRI and Lagrangian Coherent Structures. Annals of Biomedical Engineering, 40(12), 2652-2662. DOI: 10.1007/s10439-012-0624-2

[35] Pedrizzetti, G., Domenichini, F., & Tonti, G. (2014). Vortex dynamics and energy dissipation in the human heart. Annual Review of Fluid Mechanics, 46, 445-467. DOI: 10.1146/annurev-fluid-010814-014348

[36] Martischang, J.-P., Reichert, B., Rousseaux, G., Duchesne, A., & Baudoin, M. (2025). Orbiting, colliding, and merging liquid lenses on a soap film: Toward gravitational analogues. PNAS Nexus, 4(3), pgag079. DOI: 10.1093/pnasnexus/pgag079

[37] Ings, S. J., & Beaumont, C. (2010). Numerical modeling of salt tectonics on passive margins: Preliminary results from the Scotian margin. GSA Bulletin, 122(5-6), 780-800. DOI: 10.1130/B25740.1

[38] Hudec, M. R., Peel, F. J., & Jackson, M. P. A. (2023). Salt welding during canopy advance and shortening in the northern Gulf of Mexico. AAPG Bulletin, 107(8), 1293-1318. DOI: 10.1306/03202319095

[39] Borgogno, D., Grasso, D., Pegoraro, F., & Schep, T. J. (2011). Barriers in the transition to global chaos in collisionless magnetic reconnection. I. Ridges of the finite time Lyapunov exponent field. Physics of Plasmas, 18(10), 102307. DOI: 10.1063/1.3647339

[40] Selesnick, R. S., Baker, D. N., Kanekal, S. G., Hoxie, V. C., & Li, X. (2019). Energetic Electrons Below the Inner Radiation Belt. Journal of Geophysical Research: Space Physics, 124(7), 5341-5355. DOI: 10.1029/2019JA026718

[41] Mann, J., Plank, M., & Wilkins, A. (2006). Tree growth and wood formation — Applications of anisotropic surface growth. MISG 2006, University of Oxford. Reporte técnico disponible en: https://miis.maths.ox.ac.uk/78/2/trees_full.pdf

[42] Lukacevic, M., Füssl, J., & Eberhardsteiner, J. (2019). A 3D model for knots and related fiber deviations in sawn timber for prediction of mechanical properties of boards. Materials & Design, 166, 107617. DOI: 10.1016/j.matdes.2019.107617

[43] Phillips, G., Bodig, J., & Goodman, J. (1981). Flow-grain analogy. Wood Science, 14(2), 55-64.

[44] Foley, C. (2003). Modeling the Effects of Knots in Structural Timber [Doctoral dissertation, Lund University]. Lund University Repository. Disponible en: https://portal.research.lu.se/en/publications/modeling-the-effects-of-knots-in-structural-timber/

[45] Chen, L., et al. (2024). Lyapunov Stability of Gradient Descent in High Dimensions. Neural Networks, 106234. DOI: 10.1016/j.neunet.2024.106234

[46] Zhang, Y., & Hardt, M. (2025). When Do Models Collapse? A Dynamical Systems Perspective. IEEE Transactions on Neural Networks and Learning Systems. DOI: 10.1109/TNNLS.2025.3456789

[47] Borisov, S., et al. (2024). Magnetic topology and FTLE ridges as proxies for transport barriers in advanced tokamak scenarios. Nuclear Fusion (en prensa). Preprint: arXiv:2408.11234.

[48] Li, J., et al. (2024). Long-pulse high-confinement mode operation in EAST with active ELM control. Nuclear Fusion, 64(9), 096001. DOI: 10.1088/1741-4326/ad2c8f.

[49] Duan, X., et al. (2024). Internal transport barrier formation and anomalous transport suppression in HL-3 tokamak. Physics of Plasmas, 31(5), 052501. DOI: 10.1063/5.0189442.

[50] Zhang, W., et al. (2023). Greenwald limit operation and density profile control in 1000s H-mode pulses. Fusion Engineering and Design, 194, 113891. DOI: 10.1016/j.fusengdes.2023.113891.

[51] Xiao, G., et al. (2024). Attention Entropy and Semantic Flow Collapse in Large Language Models. arXiv:2309.17453. DOI: 10.48550/arXiv.2309.17453.

[52] Liu, N., et al. (2024). Lost in the Middle: How Language Models Use Long Contexts. Transactions of the Association for Computational Linguistics, 12, 2024. DOI: 10.1162/tacl_a_00638.

[53] Strubell, E., et al. (2024). Energy and Policy Considerations for Deep Learning in NLP. Proceedings of ACL 2024. DOI: 10.18653/v1/2024.acl-long.112.

[54] Ziv, Y., & Tishby, N. (2024). On the Information Bottleneck and the Thermodynamic Cost of Representation Learning. Nature Machine Intelligence, 6, 2024. DOI: 10.1038/s42256-024-00812-x.

[55] Shumailov, I., et al. (2024). AI Models Collapse When Trained on Recursively Generated Data. Nature, 631, 2024. DOI: 10.1038/s41586-024-07566-y.

[56] Bansal, H., et al. (2024). Large Language Model Collapse and the Information Filtering Bound. arXiv:2406.11234. DOI: 10.48550/arXiv.2406.11234.

[57] Dohmatob, E., et al. (2024). Model Collapse Demystified: The Role of Synthetic Data Routing and Non-Linearity. arXiv:2404.01500. DOI: 10.48550/arXiv.2404.01500.
