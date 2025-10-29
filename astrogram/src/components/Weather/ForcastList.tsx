import React from 'react'


type ForecastItem = {
day: string
temp: string
icon: string
}


type Props = {
forecast: ForecastItem[]
}


const ForecastList: React.FC<Props> = ({ forecast }) => (
<div className="flex gap-3 overflow-x-auto pb-2">
{forecast.map((item, idx) => (
<div key={idx} className="min-w-[72px] bg-gradient-to-b from-slate-900/60 to-slate-800/40 border border-white/10 rounded-xl p-2 text-center shadow-sm">
<div className="text-xs text-gray-400 mb-1">{item.day}</div>
<div className="text-2xl leading-none">{item.icon}</div>
<div className="mt-1 text-sm font-semibold">{item.temp}</div>
</div>
))}
</div>
)


export default ForecastList