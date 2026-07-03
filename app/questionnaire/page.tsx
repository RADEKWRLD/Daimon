import type { Metadata } from "next";

import { QuestionnaireWizard } from "./questionnaire-wizard";

export const metadata: Metadata = {
  title: "问卷 · Daimon",
};

export default function QuestionnairePage() {
  return <QuestionnaireWizard />;
}
