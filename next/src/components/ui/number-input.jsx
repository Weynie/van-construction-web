import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const NumberInput = React.forwardRef(({ 
  className, 
  value, 
  onChange, 
  onValueChange,
  min, 
  max, 
  step = 0.1, 
  disabled = false,
  precision = 1, // Number of decimal places
  ...props 
}, ref) => {
  // Initialize internal value with proper formatting
  const [internalValue, setInternalValue] = React.useState(() => {
    const initialValue = value !== undefined ? value : 0
    return Number(initialValue.toFixed(precision))
  })
  
  const formatValue = React.useCallback((val) => {
    const numVal = Number(val)
    return Number(numVal.toFixed(precision))
  }, [precision])

  const handleValueChange = React.useCallback((newValue) => {
    const numValue = parseFloat(newValue)
    const validValue = isNaN(numValue) ? 0 : numValue
    
    // Apply min/max constraints
    let constrainedValue = validValue
    if (min !== undefined) constrainedValue = Math.max(min, constrainedValue)
    if (max !== undefined) constrainedValue = Math.min(max, constrainedValue)
    
    const formattedValue = formatValue(constrainedValue)
    setInternalValue(formattedValue)
    
    // Call callbacks
    if (onChange) {
      onChange({ target: { value: formattedValue.toString() } })
    }
    if (onValueChange) {
      onValueChange(formattedValue)
    }
  }, [min, max, onChange, onValueChange, formatValue])

  const increment = React.useCallback(() => {
    const currentValue = internalValue || 0
    const newValue = currentValue + step
    handleValueChange(newValue)
  }, [internalValue, step, handleValueChange])

  const decrement = React.useCallback(() => {
    const currentValue = internalValue || 0
    const newValue = currentValue - step
    handleValueChange(newValue)
  }, [internalValue, step, handleValueChange])

  const handleInputChange = React.useCallback((e) => {
    const inputValue = e.target.value
    if (inputValue === '' || inputValue === '-') {
      setInternalValue(0)
      if (onChange) onChange({ target: { value: '0' } })
      if (onValueChange) onValueChange(0)
      return
    }
    
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      handleValueChange(numValue)
    }
  }, [handleValueChange, onChange, onValueChange])

  // Sync with external value changes - improved comparison
  React.useEffect(() => {
    if (value !== undefined) {
      const formattedExternalValue = formatValue(value)
      const formattedInternalValue = formatValue(internalValue)
      
      // Compare formatted values to avoid floating point precision issues
      if (Math.abs(formattedExternalValue - formattedInternalValue) > 0.001) {
        setInternalValue(formattedExternalValue)
      }
    }
  }, [value, internalValue, formatValue])

  const canDecrement = min !== undefined ? internalValue > min : true
  const canIncrement = max !== undefined ? internalValue < max : true

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 rounded-r-none border-r-0 hover:bg-muted/50"
        onClick={decrement}
        disabled={disabled || !canDecrement}
        tabIndex={-1} // Prevent tab focus on buttons
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      <Input
        {...props}
        ref={ref}
        type="number"
        value={internalValue}
        onChange={handleInputChange}
        disabled={disabled}
        className={cn(
          "h-8 rounded-none border-x-0 text-center font-mono",
          "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-ring",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        )}
        min={min}
        max={max}
        step={step}
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 rounded-l-none border-l-0 hover:bg-muted/50"
        onClick={increment}
        disabled={disabled || !canIncrement}
        tabIndex={-1} // Prevent tab focus on buttons
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
})

NumberInput.displayName = "NumberInput"

export { NumberInput } 