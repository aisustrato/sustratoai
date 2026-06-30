-- 📍 scripts/seed-first-paper.sql
-- Script de ejemplo para insertar el primer paper en la tabla papers
-- INSTRUCCIONES: Reemplazar los valores de ejemplo con los datos reales del paper

INSERT INTO public.papers (
    slug,
    title,
    subtitle,
    abstract_es,
    abstract_en,
    authors,
    keywords,
    content_md,
    doi,
    zenodo_url,
    pdf_url,
    language,
    published_at,
    is_published,
    version,
    citation_apa,
    license
) VALUES (
    -- slug: URL-friendly identifier
    'paradox-to-infrastructure-sustrato-ai',
    
    -- title: Título completo del paper
    'From Paradox to Infrastructure: Sustrato.ai and the Encoding of Epistemic Humility',
    
    -- subtitle: Subtítulo opcional
    NULL,
    
    -- abstract_es: Resumen en español
    'Este artículo documenta la contradicción metodológica entre investigar la autonomía de adultos mayores y usar modelos de lenguaje genéricos que heredan sesgos de vigilancia clínica preexistentes en el corpus académico. Para abordar esta fricción, presentamos sustrato.ai, una plataforma de revisión sistemática asistida por IA que codifica la trazabilidad interpretativa mediante un diálogo estructurado de tres iteraciones entre investigador humano e IA, respaldado por un registro inmutable append-only con verificación criptográfica SHA-256. La plataforma se desplegó en un piloto empírico que procesó 257 artículos científicos sobre inteligencia artificial y adultos mayores, identificando un subcorpus primario de 192 documentos. La extracción estructurada revela que el 62.5% de estos artículos restringe su evaluación a métricas clínicas o de rendimiento técnico, mientras que solo 9 estudios abordan el ocio otorgando agencia protagónica al adulto mayor. Simultáneamente, el proyecto demuestra que la barrera para realizar este nivel de escrutinio no es presupuestaria: contra una literatura donde el 77.6% del financiamiento es patronazgo académico endógeno, el costo total de procesamiento automatizado por API fue inferior a un dólar estadounidense. La convergencia de estos resultados empíricos y arquitectónicos permite la siguiente interpretación: la infraestructura usada para revisar la literatura condiciona qué se vuelve visible dentro de ella. Sustrato.ai propone un modelo reproducible para documentar metodológicamente la fricción entre juicio humano y clasificación algorítmica.',
    
    -- abstract_en: Resumen en inglés
    'This paper documents the methodological contradiction between researching the autonomy of older adults and using generic language models that inherit clinical surveillance biases pre-existing in the academic corpus. To address this friction, we present sustrato.ai, an AI-assisted systematic review platform that encodes interpretive traceability through a structured three-iteration dialogue between a human researcher and AI, backed by an immutable append-only registry with SHA-256 cryptographic verification. The platform was deployed in an empirical pilot that processed 257 scientific articles on artificial intelligence and older adults, identifying a primary subcorpus of 192 documents. Structured extraction reveals that 62.5% of these articles restrict their evaluation to clinical or technical performance metrics, while only 9 studies address leisure granting protagonist agency to the older adult. Simultaneously, the project demonstrates that the barrier to conducting this level of scrutiny is not budgetary: against a literature where 77.6% of funding is endogenous academic patronage, the total automated API processing cost was less than one US dollar. The convergence of these empirical and architectural results allows the following interpretation: the infrastructure used to review the literature conditions what becomes visible within it. Sustrato.ai proposes a reproducible model for methodologically documenting the friction between human judgment and algorithmic classification.',
    
    -- authors: Array JSON de autores
    '[
        {
            "name": "Rodolfo Leiva",
            "orcid": "0009-0003-4251-2733",
            "affiliation": "sustrato.ai",
            "role": "Human-in-the-loop 2.0"
        }
    ]'::jsonb,
    
    -- keywords: Array de palabras clave
    ARRAY[
        'AI-assisted systematic review',
        'append-only architecture',
        'interpretive traceability',
        'older adults',
        'leisure',
        'algorithmic bias',
        'human-AI co-research',
        'data sovereignty'
    ],
    
    -- content_md: Contenido completo en Markdown
    '# From Paradox to Infrastructure: Sustrato.ai and the Encoding of Epistemic Humility

**Version:** 1.8 — Pre-Zenodo (validated data)  
**Author:** Rodolfo Leiva (Human-in-the-loop 2.0)  
**ORCID:** [0009-0003-4251-2733](https://orcid.org/0009-0003-4251-2733)  
**Date:** April 2026

---

## Abstract

This paper documents the methodological contradiction between researching the autonomy of older adults and using generic language models that inherit clinical surveillance biases pre-existing in the academic corpus. To address this friction, we present sustrato.ai, an AI-assisted systematic review platform that encodes interpretive traceability through a structured three-iteration dialogue between a human researcher and AI, backed by an immutable append-only registry with SHA-256 cryptographic verification.

The platform was deployed in an empirical pilot that processed 257 scientific articles on artificial intelligence and older adults, identifying a primary subcorpus of 192 documents. Structured extraction reveals that 62.5% of these articles restrict their evaluation to clinical or technical performance metrics, while only 9 studies address leisure granting protagonist agency to the older adult. Simultaneously, the project demonstrates that the barrier to conducting this level of scrutiny is not budgetary: against a literature where 77.6% of funding is endogenous academic patronage, the total automated API processing cost was less than one US dollar.

The convergence of these empirical and architectural results allows the following interpretation: the infrastructure used to review the literature conditions what becomes visible within it. Sustrato.ai proposes a reproducible model for methodologically documenting the friction between human judgment and algorithmic classification.

**Keywords:** AI-assisted systematic review, append-only architecture, interpretive traceability, older adults, leisure, algorithmic bias, human-AI co-research, data sovereignty.

---

## §1 — Introduction: The Foundational Paradox

This paper documents the genesis, architecture, and preliminary results of sustrato.ai, an AI-assisted systematic literature review platform. Its development (2023–2026) responds to a concrete methodological contradiction: what happens when the language models used to analyze human autonomy reproduce, through inheritance from the academic corpus that trained them, the very biases the research seeks to identify?

The platform emerged from the friction between a research question centered on the proactive leisure of older adults through AI, and the inability of available generic tools to process the literature without inheriting historical clinical biases. This document describes how that methodological need compelled the research team to transition from users of commercial AI to architects of their own infrastructure, and how that infrastructure, by embedding principles of traceability and integrity in its code, revealed patterns in the literature that conventional methods had not documented.

The work presents two interrelated contributions: (1) the empirical findings from a pilot of 257 articles on AI and older adults in the domain of leisure — where only 9 articles in the entire corpus address the older adult as protagonist of their free time through artificial intelligence — and (2) the description of sustrato.ai as a reproducible methodological contribution. Both require each other: without the pilot, the platform lacks evidence; without the platform, the findings would not have been possible with existing tools.

---

## §2 — Context: From Hardware to Rights

The project''s starting point was an epistemological decision. In late 2023, the intersection of technology and aging was dominated by the narrative of virtual reality (VR) as a solution to social isolation among the elderly. Against this paradigm, the research team chose to discard VR and focus on exploring how artificial intelligence could foster autonomy through leisure. This choice was anchored in Article 22 of the Inter-American Convention on Protecting the Human Rights of Older Persons (OAS, 2015), which establishes the right to recreation, physical activity, leisure, and sport, with the purpose of promoting self-realization, independence, autonomy, and inclusion in the community. The focus shifted from hardware to rights: from passive surveillance to proactive enjoyment of free time.

[... continuar con el resto del contenido del paper ...]

---

## References

Chu, C. H., Niu, X., Storey, K., & Xie, B. (2022). Ageism and artificial intelligence: A scoping review. *The Gerontologist*, 62(3), e134–e145. https://doi.org/10.1093/geront/gnab154

Coleman, D., & Iso-Ahola, S. E. (1993). Leisure and health: The role of social support and self-determination. *Journal of Leisure Research*, 25(2), 111–128. https://doi.org/10.1080/00222216.1993.11969913

[... resto de referencias ...]

---

**Tone:** We do not judge; we notarize. Data is presented; the reader concludes.

**Validated exports:** April 13, 2026 — Phases 1, 2, and 4 with SHA-256 certified hashes.
',
    
    -- doi: Digital Object Identifier (pendiente Zenodo)
    NULL,
    
    -- zenodo_url: URL del registro en Zenodo (pendiente)
    NULL,
    
    -- pdf_url: URL del PDF (pendiente)
    NULL,
    
    -- language: Código de idioma
    'en',
    
    -- published_at: Fecha de publicación
    '2026-04-16T00:00:00Z'::timestamptz,
    
    -- is_published: Marcar como publicado
    true,
    
    -- version: Versión del paper
    '1.8',
    
    -- citation_apa: Cita en formato APA
    'Leiva, R. (2026). From Paradox to Infrastructure: Sustrato.ai and the Encoding of Epistemic Humility (Version 1.8). sustrato.ai.',
    
    -- license: Licencia
    'CC-BY-4.0'
);

-- Verificar que se insertó correctamente
SELECT slug, title, version, is_published, published_at 
FROM public.papers 
WHERE slug = 'paradox-to-infrastructure-sustrato-ai';
