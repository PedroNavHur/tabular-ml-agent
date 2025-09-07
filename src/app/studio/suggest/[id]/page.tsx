import SuggestClient from "./SuggestClient";

export default function Page({ params }: { params: { id: string } }) {
  return <SuggestClient id={params.id} />;
}
