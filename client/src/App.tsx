import React from "react";

import { CreateStreamForm } from "@components/create-stream-form";
import { RecordingList } from "@components/recording-list";
import { Container } from "@components/container";

export function App() {
  return (
    <Container>
      <CreateStreamForm />
      <RecordingList />
    </Container>
  );
}
