import * as React from "react"
import { cn } from "@/lib/utils/cn"

export interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value = [0], min = 0, max = 100, step = 1, onValueChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(event.target.value)
      onValueChange?.([newValue])
    }

    return (
      <div
        ref={ref}
        className={cn("relative w-full", className)}
        {...props}
      >
        <input
          type="range"
          value={value[0]}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        />
        <div 
          className="absolute h-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg top-0 left-0" 
          style={{ 
            width: `${((value[0] - min) / (max - min)) * 100}%` 
          }}
        />
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }