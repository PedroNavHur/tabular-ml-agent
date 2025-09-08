import ResultsClient from "./ResultsClient";

export default function Page({ params }: { params: { id: string } }) {
  return <ResultsClient id={params.id} />;
}
