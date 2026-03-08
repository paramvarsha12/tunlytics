import { motion } from 'framer-motion'

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      className="card-elevated overflow-hidden"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-white/55">{subtitle}</div> : null}
        </div>
        <div className="h-10 w-10 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(29,185,84,0.25),transparent_55%)] ring-1 ring-white/10" />
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </motion.section>
  )
}

