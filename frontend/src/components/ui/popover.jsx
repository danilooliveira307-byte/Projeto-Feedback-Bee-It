import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

// Safe Portal wrapper to prevent removeChild errors
const SafePopoverPortal = ({ children }) => {
  const [canRender, setCanRender] = React.useState(false)
  
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setCanRender(true)
    })
    return () => {
      cancelAnimationFrame(frame)
      setCanRender(false)
    }
  }, [])

  if (!canRender) return null
  
  return <PopoverPrimitive.Portal>{children}</PopoverPrimitive.Portal>
}

const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <SafePopoverPortal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        className
      )}
      {...props} />
  </SafePopoverPortal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
