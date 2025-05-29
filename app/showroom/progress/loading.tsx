import { PageBackground } from "@/components/ui/page-background"
import { Text } from "@/components/ui/text"
import { Progress } from "@/components/ui/progress"

export default function Loading() {
  return (
    <PageBackground variant="gradient">
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[50vh]">
        <Text as="h1" size="2xl" weight="bold" className="mb-6">
          Cargando Showroom de Progreso...
        </Text>

        <div className="w-full max-w-md">
          <Progress indeterminate variant="primary" size="lg" label="Cargando componentes" />
        </div>
      </div>
    </PageBackground>
  )
}
