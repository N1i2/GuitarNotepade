import { ALL_COLORS } from "@/lib/song-segment-utils";

export { ALL_COLORS as COLOR_PALETTE };

export interface ColorAssignment {
  id: string;
  type: "chord" | "pattern";
  color: string;
  name: string;
}

export class ColorPool {
  private availableColors: string[];
  private assignedColors: Map<string, ColorAssignment>;

  constructor() {
    this.availableColors = [...ALL_COLORS];
    this.assignedColors = new Map();
  }

  getColor(id: string, type: "chord" | "pattern", name: string): string {
    if (this.assignedColors.has(id)) {
      return this.assignedColors.get(id)!.color;
    }

    this.refreshAvailableColors();

    if (this.availableColors.length === 0) {
      console.warn("All resource colors are assigned");
      return ALL_COLORS[this.assignedColors.size % ALL_COLORS.length];
    }

    const color = this.availableColors.shift()!;
    this.assignedColors.set(id, { id, type, color, name });

    return color;
  }

  forceAssignColor(
    id: string,
    type: "chord" | "pattern",
    name: string,
    color: string,
  ): void {
    const existingAssignment = Array.from(this.assignedColors.values()).find(
      (assignment) => assignment.color === color && assignment.id !== id,
    );

    if (existingAssignment) {
      this.availableColors.push(existingAssignment.color);
      this.assignedColors.delete(existingAssignment.id);
    }

    if (this.assignedColors.has(id)) {
      const oldColor = this.assignedColors.get(id)!.color;
      if (!this.availableColors.includes(oldColor)) {
        this.availableColors.push(oldColor);
      }
    }

    const colorIndex = this.availableColors.indexOf(color);
    if (colorIndex !== -1) {
      this.availableColors.splice(colorIndex, 1);
    }

    this.assignedColors.set(id, { id, type, color, name });
  }

  releaseColor(id: string): void {
    const assignment = this.assignedColors.get(id);
    if (assignment) {
      if (!this.availableColors.includes(assignment.color)) {
        this.availableColors.push(assignment.color);
      }
      this.assignedColors.delete(id);
    }
  }

  getAllAssignments(): ColorAssignment[] {
    return Array.from(this.assignedColors.values());
  }

  getChordAssignments(): ColorAssignment[] {
    return this.getAllAssignments().filter((assignment) => assignment.type === "chord");
  }

  getPatternAssignments(): ColorAssignment[] {
    return this.getAllAssignments().filter(
      (assignment) => assignment.type === "pattern",
    );
  }

  updateColor(id: string, newColor: string): boolean {
    const assignment = this.assignedColors.get(id);
    if (!assignment) return false;

    this.forceAssignColor(id, assignment.type, assignment.name, newColor);
    return true;
  }

  reset(): void {
    this.availableColors = [...ALL_COLORS];
    this.assignedColors.clear();
  }

  getUsedColors(): string[] {
    return Array.from(this.assignedColors.values()).map(
      (assignment) => assignment.color,
    );
  }

  private refreshAvailableColors(): void {
    const usedColors = new Set(this.getUsedColors());
    this.availableColors = ALL_COLORS.filter((color) => !usedColors.has(color));
  }
}
