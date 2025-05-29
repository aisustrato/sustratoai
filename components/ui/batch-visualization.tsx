"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Slider } from "@/components/ui/slider"

// Definir colores para cada miembro
const MEMBER_COLORS = [
  { primary: "from-blue-400 to-blue-600", secondary: "bg-blue-500", text: "text-blue-200", name: "Azul" },
  { primary: "from-rose-400 to-rose-600", secondary: "bg-rose-500", text: "text-rose-200", name: "Rosa" },
  { primary: "from-amber-400 to-amber-600", secondary: "bg-amber-500", text: "text-amber-200", name: "Ámbar" },
  {
    primary: "from-emerald-400 to-emerald-600",
    secondary: "bg-emerald-500",
    text: "text-emerald-200",
    name: "Esmeralda",
  },
  { primary: "from-purple-400 to-purple-600", secondary: "bg-purple-500", text: "text-purple-200", name: "Púrpura" },
]

export default function BatchVisualization() {
  const [batchSize, setBatchSize] = useState(50)
  const [memberCount, setMemberCount] = useState(3)
  const totalItems = 3000
  const [batches, setBatches] = useState<number[]>([])
  const [memberAssignments, setMemberAssignments] = useState<number[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  // Calculate number of batches based on batch size
  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => {
      const numberOfBatches = Math.ceil(totalItems / batchSize)
      const newBatches = Array.from({ length: numberOfBatches }, (_, i) =>
        i === numberOfBatches - 1 ? totalItems % batchSize || batchSize : batchSize,
      )
      setBatches(newBatches)

      // Assign batches to members
      const assignments = assignBatchesToMembers(newBatches.length, memberCount)
      setMemberAssignments(assignments)

      setIsAnimating(false)
    }, 300) // Small delay to allow animation to be perceived

    return () => clearTimeout(timer)
  }, [batchSize, memberCount])

  // Assign batches to members evenly
  const assignBatchesToMembers = (batchCount: number, members: number) => {
    const assignments: number[] = []
    const batchesPerMember = Math.ceil(batchCount / members)

    for (let i = 0; i < batchCount; i++) {
      const memberIndex = Math.min(Math.floor(i / batchesPerMember), members - 1)
      assignments.push(memberIndex)
    }

    return assignments
  }

  // Calculate grid layout parameters
  const calculateGridParams = () => {
    const batchCount = batches.length
    const columns = Math.ceil(Math.sqrt(batchCount))
    return { columns }
  }

  const { columns } = calculateGridParams()

  // Generate items for the batch weight visualization
  const batchItems = Array.from({ length: batchSize }, (_, i) => i)

  // Count batches per member
  const batchesPerMember = memberAssignments.reduce(
    (acc, memberIndex) => {
      acc[memberIndex] = (acc[memberIndex] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="w-full max-w-5xl space-y-12">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center text-white">Distribución de Lotes por Miembros</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700/50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Tamaño de Lote</h3>
              <div className="flex justify-between mb-2 text-slate-300">
                <span>Tamaño: {batchSize}</span>
                <span>Total: {batches.length} lotes</span>
              </div>
              <Slider
                value={[batchSize]}
                min={5}
                max={100}
                step={5}
                onValueChange={(value) => setBatchSize(value[0])}
                className="my-6"
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>Lotes pequeños (muchos)</span>
                <span>Lotes grandes (pocos)</span>
              </div>
            </div>

            <div className="bg-slate-700/50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Número de Miembros</h3>
              <div className="flex justify-between mb-2 text-slate-300">
                <span>Miembros: {memberCount}</span>
                <span>Distribución: {Math.ceil(batches.length / memberCount)} lotes/miembro</span>
              </div>
              <Slider
                value={[memberCount]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => setMemberCount(value[0])}
                className="my-6"
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>Menos miembros</span>
                <span>Más miembros</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Batch distribution visualization */}
          <div className="relative bg-slate-800/80 rounded-xl p-6 h-[500px] overflow-hidden flex-1">
            <h2 className="text-xl font-semibold text-white mb-4">Distribución de Lotes</h2>
            <div
              className="grid gap-3 w-full h-[calc(100%-2rem)]"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {batches.map((size, index) => {
                const memberIndex = memberAssignments[index] || 0
                const colorScheme = MEMBER_COLORS[memberIndex]

                return (
                  <motion.div
                    key={`${index}-${batches.length}-${memberCount}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: isAnimating ? 0.8 : 1,
                      opacity: 1,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.01,
                    }}
                    className="relative flex items-center justify-center"
                  >
                    <motion.div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${colorScheme.primary}`}
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: (index * 0.05) % 1,
                      }}
                    />
                  </motion.div>
                )
              })}
            </div>

            <motion.div
              className="absolute inset-0 bg-slate-800/30 flex items-center justify-center text-white text-xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: isAnimating ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              Recalculando...
            </motion.div>
          </div>

          {/* Batch weight visualization */}
          <div className="relative bg-slate-800/80 rounded-xl p-6 h-[500px] overflow-hidden w-[300px]">
            <h2 className="text-xl font-semibold text-white mb-4">Peso del Lote</h2>
            <div className="flex flex-col h-[calc(100%-2rem)] justify-end">
              <div className="relative h-full w-full flex items-end justify-center">
                <motion.div
                  className="relative w-40 bg-slate-700/50 rounded-t-lg overflow-hidden"
                  animate={{ height: `${Math.min(100, (batchSize / 100) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="absolute inset-0 flex flex-col-reverse">
                    {batchItems.map((item) => (
                      <motion.div
                        key={item}
                        className="w-full h-[3px] bg-gradient-to-r from-amber-400 to-orange-500 mb-[2px]"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{
                          delay: item * 0.01,
                          duration: 0.3,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20" />
              </div>
              <div className="mt-4 text-center text-white">
                <div className="text-2xl font-bold">{batchSize}</div>
                <div className="text-sm text-slate-400">elementos por lote</div>
              </div>
            </div>
          </div>
        </div>

        {/* Member distribution legend */}
        <div className="bg-slate-800/50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución por Miembros</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: memberCount }).map((_, index) => {
              const colorScheme = MEMBER_COLORS[index]
              const batchCount = batchesPerMember[index] || 0
              const percentage = Math.round((batchCount / batches.length) * 100)

              return (
                <div
                  key={index}
                  className={`bg-slate-700/30 rounded-lg p-4 border-l-4 ${colorScheme.secondary} border-l-4`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`font-semibold ${colorScheme.text}`}>Miembro {index + 1}</div>
                    <div className="text-white text-sm">{percentage}%</div>
                  </div>
                  <div className="text-2xl font-bold text-white">{batchCount}</div>
                  <div className="text-sm text-slate-400">lotes asignados</div>
                  <div className="mt-2 h-2 bg-slate-600 rounded-full overflow-hidden">
                    <motion.div
                      className={colorScheme.secondary}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
