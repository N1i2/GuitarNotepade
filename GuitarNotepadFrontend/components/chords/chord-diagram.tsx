"use client";

interface ChordDiagramProps {
  fingering: string; 
  name?: string;
  size?: "sm" | "md" | "lg";
}

export function ChordDiagram({ fingering, name, size = "md" }: ChordDiagramProps) {
  const sizeClasses = {
    sm: "w-48 h-64",
    md: "w-72 h-96",
    lg: "w-96 h-128"
  };

  const fretClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base"
  };

  const stringClasses = {
    sm: "w-0.5",
    md: "w-1",
    lg: "w-1.5"
  };

  const parseFingering = (fingering: string): (number | "X" | 0)[] => {
    if (!fingering) return [0, 0, 0, 0, 0, 0];
    
    let values: string[];
    if (fingering.includes('-')) {
      values = fingering.split('-');
    } else {
      values = fingering.split('');
    }
    
    while (values.length < 6) {
      values.push('0');
    }
    
    return values.slice(0, 6).map(val => {
      if (val === 'X' || val === 'x') return 'X';
      const num = parseInt(val, 10);
      return isNaN(num) ? 0 : num;
    });
  };

  const values = parseFingering(fingering);
  
  const displayValues = values;

  const getFretColor = (fret: number): string => {
    if (fret <= 3) return '#3b82f6'; 
    if (fret <= 5) return '#8b5cf6'; 
    if (fret <= 7) return '#ef4444'; 
    if (fret <= 9) return '#f59e0b'; 
    return '#14b8a6'; 
  };

  const numberValues = values.filter(v => typeof v === 'number' && v > 0) as number[];
  const maxFret = numberValues.length > 0 ? Math.max(...numberValues) : 0;
  const displayFrets = Math.max(maxFret, 4); 

  const stringNotes = ["E", "A", "D", "G", "B", "E"];

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      <div className="absolute inset-0 bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg shadow-lg"></div>
      
      <div className="absolute inset-4 flex flex-col justify-between">
        {Array.from({ length: displayFrets }).map((_, fret) => (
          <div
            key={fret + 1}
            className={`absolute left-4 right-4 h-0.5 bg-amber-700/50 ${size === 'lg' ? 'h-1' : ''}`}
            style={{ top: `${(fret) * (100 / displayFrets)}%` }}
          ></div>
        ))}
      </div>

      <div className="absolute inset-0 flex items-center">
        {displayValues.map((value, index) => {
          const stringNumber = 6 - index; 
          const isOpen = value === 0;
          const isMuted = value === "X";
          const isFretted = typeof value === 'number' && value > 0;
          const fretNumber = isFretted ? value as number : 0;
          
          const leftPosition = (index * 100) / (displayValues.length - 1);
          
          return (
            <div 
              key={index} 
              className="absolute top-0 bottom-0 w-0.5 bg-gray-300"
              style={{ left: `${leftPosition}%` }}
            >
              {isFretted && (
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm z-10 shadow-lg"
                  style={{
                    top: `${((fretNumber - 1) * (100 / displayFrets)) + (50 / displayFrets)}%`,
                    backgroundColor: getFretColor(fretNumber)
                  }}
                >
                  {fretNumber}
                </div>
              )}
              
              {isOpen && (
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2"
                  style={{ top: '4%' }}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-white bg-transparent"></div>
                </div>
              )}
              
              {isMuted && (
                <div 
                  className="absolute left-1/2 transform -translate-x-1/2"
                  style={{ top: '4%' }}
                >
                  <div className="relative w-5 h-5">
                    <div className="absolute inset-0 w-full h-0.5 bg-red-500 transform rotate-45 top-1/2 -translate-y-1/2"></div>
                    <div className="absolute inset-0 w-full h-0.5 bg-red-500 transform -rotate-45 top-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="absolute -top-8 left-0 right-0 flex justify-around">
        {displayValues.map((_, index) => {
          const stringNumber = 6 - index; 
          return (
            <div key={index} className="text-sm font-bold text-muted-foreground">
              {stringNumber}
            </div>
          );
        })}
      </div>
      
      <div className="absolute -bottom-8 left-0 right-0 flex justify-around">
        {stringNotes.map((note, index) => (
          <div key={index} className="text-xs text-muted-foreground">
            {note}
          </div>
        ))}
      </div>

      <div className="absolute top-2 left-0 right-0 h-0.5 bg-white/30 mx-4"></div>

      {name && (
        <div className="absolute -bottom-16 left-0 right-0 text-center">
          <div className="font-bold text-xl">{name}</div>
          <div className="text-sm text-muted-foreground font-mono mt-1">
            {fingering}
          </div>
        </div>
      )}
    </div>
  );
}