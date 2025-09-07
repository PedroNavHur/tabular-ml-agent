import PreprocessClient from "./PreprocessClient";

export default function Page({ params }: { params: { id: string } }) {
  return <PreprocessClient id={params.id} />;
}
