import { PlaceholderPage } from "@/app/pages/PlaceholderPage";
import { useParams } from "react-router-dom";

export function BookDetailsPage() {
  const { id } = useParams();

  return (
    <PlaceholderPage
      title="Detalhe do livro"
      description={`Informações sobre o livro ${id}.`}
    />
  );
}