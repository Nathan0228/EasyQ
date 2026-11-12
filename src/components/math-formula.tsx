import { ScrollView } from "react-native";
import { AppText } from "@/components/app-text";
import type { MathSource } from "@/lib/markdown-math";

export type MathFormulaProps = MathSource & { display?: boolean };

// The website typesets formulas; native builds keep the original TeX readable.
export function MathFormula({ source, display = false }: MathFormulaProps) {
  const text = <AppText selectable>{source}</AppText>;
  return display ? <ScrollView horizontal className="my-4">{text}</ScrollView> : text;
}
