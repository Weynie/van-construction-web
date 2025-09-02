"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { themePreferenceService } from "@/services/themePreferenceService"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle({ userId }) {
  const { setTheme } = useTheme()

  const handleThemeChange = async (theme) => {
    // Update the theme immediately for responsive UI
    setTheme(theme);
    
    // Save to localStorage as fallback
    themePreferenceService.saveThemeToLocalStorage(theme);
    
    // Save to database if user is authenticated
    if (userId) {
      try {
        await themePreferenceService.updateThemePreference(userId, theme);
        console.log('Theme preference saved to database:', theme);
      } catch (error) {
        console.error('Failed to save theme preference to database:', error);
        // Theme is still saved to localStorage, so user experience is not affected
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 