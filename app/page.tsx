import { Text } from "@/components/ui/text";
import { PageBackground } from "@/components/ui/page-background";
import { Divider } from "@/components/ui/divider";
import { HomeCards } from "@/components/HomeCards";

export default function Home() {
  return (
    <PageBackground variant="gradient" >
      {/* Hero Section */}
      <section className="text-center pt-20 pb-8 md:pt-24 md:pb-10">
        <div className="flex flex-col items-center mb-4">
          <Text
            variant="label"
            color="primary"
            colorVariant="pure"
            className="uppercase tracking-wider mb-3 font-bold"
            fontType="heading"
          >
            Universidad Católica de Chile
          </Text>
          <Divider variant="gradient" size="md" className="mb-8" />
        </div>

        <Text
          as="h1"
          variant="heading"
          size="5xl"
          gradient="primary"
          className="mb-2"
          fontType="heading"
        >
          Ayudas Técnicas
        </Text>

        <Text
          as="h2"
          variant="subheading"
          size="3xl"
          gradient="secondary"
          className="mb-6"
          fontType="heading"
        >
          Escuela de Trabajo Social
        </Text>

        <Text
          variant="subtitle"
          size="xl"
          color="neutral"
          className="max-w-2xl mx-auto"
          fontType="body"
        >
          Plataforma de herramientas para investigación y análisis de datos
          cualitativos
        </Text>
      </section>

      {/* Cards Section */}
      <HomeCards />

      {/* Footer Section */}
      <div className="text-center mt-8">
        <Text variant="muted" className="mb-1" fontType="body">
          Proyecto desarrollado por la Escuela de Trabajo Social de la
          Universidad Católica de Chile
        </Text>
      </div>
    </PageBackground>
  );
}
