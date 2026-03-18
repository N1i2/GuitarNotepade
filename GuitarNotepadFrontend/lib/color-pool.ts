export const COLOR_PALETTE = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9B59B6",
  "#3498DB",
  "#E67E22",
  "#2ECC71",
  "#E74C3C",
  "#1ABC9C",
  "#F1C40F",
  "#E67E22",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722",
  "#795548",
  "#9E9E9E",
  "#607D8B",
  "#F44336",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722",
  "#795548",
  "#9E9E9E",
  "#607D8B",
];

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
    this.availableColors = [...COLOR_PALETTE];
    this.assignedColors = new Map();
  }

  getColor(id: string, type: "chord" | "pattern", name: string): string {
    if (this.assignedColors.has(id)) {
      return this.assignedColors.get(id)!.color;
    }

    if (this.availableColors.length === 0) {
      console.warn("No more colors available, reusing from palette");
      this.availableColors = [...COLOR_PALETTE];
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
      (a) => a.color === color && a.id !== id,
    );

    if (existingAssignment) {
      this.availableColors.push(existingAssignment.color);
      this.assignedColors.delete(existingAssignment.id);
    }

    if (this.assignedColors.has(id)) {
      const oldColor = this.assignedColors.get(id)!.color;
      this.availableColors.push(oldColor);
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
      this.availableColors.unshift(assignment.color);
      this.assignedColors.delete(id);
    }
  }

  getAllAssignments(): ColorAssignment[] {
    return Array.from(this.assignedColors.values());
  }

  getChordAssignments(): ColorAssignment[] {
    return this.getAllAssignments().filter((a) => a.type === "chord");
  }

  getPatternAssignments(): ColorAssignment[] {
    return this.getAllAssignments().filter((a) => a.type === "pattern");
  }

  updateColor(id: string, newColor: string): boolean {
    const assignment = this.assignedColors.get(id);
    if (!assignment) return false;

    const oldColorIndex = this.availableColors.indexOf(assignment.color);
    if (oldColorIndex !== -1) {
      this.availableColors.splice(oldColorIndex, 1);
    }

    this.availableColors.push(assignment.color);

    assignment.color = newColor;

    const newColorIndex = this.availableColors.indexOf(newColor);
    if (newColorIndex !== -1) {
      this.availableColors.splice(newColorIndex, 1);
    }

    return true;
  }

  reset(): void {
    this.availableColors = [...COLOR_PALETTE];
    this.assignedColors.clear();
  }
}
