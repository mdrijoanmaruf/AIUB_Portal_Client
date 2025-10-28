
export default function Loading() {
	return (
		<div className="min-h-screen p-6 bg-linear-to-br from-blue-50 via-white to-indigo-50">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header skeleton */}
				<div className="animate-pulse bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 p-6">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-gray-200 rounded-xl" />
							<div className="space-y-2">
								<div className="w-48 h-6 bg-gray-200 rounded" />
								<div className="w-32 h-4 bg-gray-200 rounded" />
							</div>
						</div>
						<div className="w-24 h-8 bg-gray-200 rounded" />
					</div>
				</div>

				{/* Stats skeleton */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="animate-pulse bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
							<div className="w-24 h-4 bg-gray-200 rounded mb-4" />
							<div className="w-32 h-8 bg-gray-200 rounded" />
						</div>
					))}
				</div>

				{/* Main sections skeleton */}
				<div className="space-y-6">
					<div className="animate-pulse bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 p-6">
						<div className="w-40 h-6 bg-gray-200 rounded mb-4" />
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{Array.from({ length: 6 }).map((_, idx) => (
								<div key={idx} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/50">
									<div className="w-full h-4 bg-gray-200 rounded mb-3" />
									<div className="w-3/4 h-3 bg-gray-200 rounded mb-2" />
									<div className="w-1/2 h-3 bg-gray-200 rounded" />
								</div>
							))}
						</div>
					</div>

					<div className="animate-pulse bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 p-6">
						<div className="w-44 h-6 bg-gray-200 rounded mb-4" />
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{Array.from({ length: 6 }).map((_, idx) => (
								<div key={idx} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/50">
									<div className="w-full h-4 bg-gray-200 rounded mb-3" />
									<div className="w-2/3 h-3 bg-gray-200 rounded mb-2" />
									<div className="w-1/3 h-3 bg-gray-200 rounded" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
