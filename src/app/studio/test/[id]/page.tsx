import TestClient from "./TestClient";

export default function Page({ params }: { params: { id: string } }) {
  return <TestClient id={params.id} />;
}
