import { ResponsiveContainer } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveChartProps {
  children: React.ReactElement;
  height?: number;
  mobileHeight?: number;
  className?: string;
}

/**
 * Wrapper around recharts ResponsiveContainer that handles mobile sizing
 * and prevents chart overflow on small screens.
 */
export function ResponsiveChart({ children, height = 300, mobileHeight, className = "" }: ResponsiveChartProps) {
  const isMobile = useIsMobile();
  const effectiveHeight = isMobile ? (mobileHeight || Math.min(height, 250)) : height;

  return (
    <div className={`w-full min-w-0 overflow-hidden ${className}`} style={{ height: effectiveHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

/** Common tick props for mobile-friendly charts */
export function useChartConfig() {
  const isMobile = useIsMobile();
  return {
    isMobile,
    tickFontSize: isMobile ? 9 : 11,
    legendFontSize: isMobile ? 9 : 11,
    radarOuterRadius: isMobile ? 70 : 100,
    radarAngleFontSize: isMobile ? 8 : 11,
    tooltipStyle: {
      backgroundColor: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: 8,
      fontSize: isMobile ? 10 : 12,
    },
  };
}
