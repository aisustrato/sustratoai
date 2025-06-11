//. 📍 app/showroom/simple-slider/page.tsx

"use client";

import * as React from "react";
import { StandardSlider } from "@/components/ui/StandardSlider";
import { StandardText } from "@/components/ui/StandardText";

export default function SimpleSliderShowroomPage() {
  // Estado para controlar el valor del slider
  const [sliderValue, setSliderValue] = React.useState([50]);

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <StandardText asElement="h1" size="xl" weight="medium" className="text-center">
          Prueba de StandardSlider
        </StandardText>
        
        <StandardText asElement="p" size="lg" className="text-center">
          Valor Actual: {sliderValue[0]}
        </StandardText>

        <StandardSlider
          defaultValue={[50]}
          value={sliderValue}
          onValueChange={setSliderValue}
          max={100}
          step={1}
          showTooltip={true} // Activamos el tooltip para la prueba
        />

      </div>
    </div>
  );
}