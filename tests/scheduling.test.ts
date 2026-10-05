import assert from "node:assert/strict";
import test from "node:test";
import { isAvailable, validateRequestedWindow } from "../lib/scheduling";
import { appointmentSchema } from "../lib/validation";

const event = {
  startsAt: new Date("2028-02-16T13:00:00.000Z"), // 08:00 America/Rio_Branco
  endsAt: new Date("2028-02-16T14:00:00.000Z") // 09:00 America/Rio_Branco
};

test("permite novo uso exatamente 15 minutos após o evento anterior", () => {
  const candidate = {
    startsAt: new Date("2028-02-16T14:15:00.000Z"),
    endsAt: new Date("2028-02-16T15:00:00.000Z")
  };
  assert.equal(isAvailable(candidate, [event]), true);
});

test("bloqueia intervalo inferior a 15 minutos após o evento anterior", () => {
  const candidate = {
    startsAt: new Date("2028-02-16T14:10:00.000Z"),
    endsAt: new Date("2028-02-16T15:00:00.000Z")
  };
  assert.equal(isAvailable(candidate, [event]), false);
});

test("bloqueia sobreposição parcial e total", () => {
  assert.equal(isAvailable({ startsAt: new Date("2028-02-16T13:30:00.000Z"), endsAt: new Date("2028-02-16T14:30:00.000Z") }, [event]), false);
  assert.equal(isAvailable({ startsAt: new Date("2028-02-16T13:00:00.000Z"), endsAt: new Date("2028-02-16T14:00:00.000Z") }, [event]), false);
});

test("considera a margem antes do próximo evento", () => {
  const nextEvent = {
    startsAt: new Date("2028-02-16T15:00:00.000Z"), // 10:00 America/Rio_Branco
    endsAt: new Date("2028-02-16T16:00:00.000Z")
  };
  assert.equal(isAvailable({ startsAt: new Date("2028-02-16T14:00:00.000Z"), endsAt: new Date("2028-02-16T14:50:00.000Z") }, [nextEvent]), false);
  assert.equal(isAvailable({ startsAt: new Date("2028-02-16T14:00:00.000Z"), endsAt: new Date("2028-02-16T14:45:00.000Z") }, [nextEvent]), true);
});

test("rejeita horário final igual ou anterior ao inicial", () => {
  assert.equal(appointmentSchema.safeParse({ requesterName: "Maria Silva", department: "Comunicação", email: "maria@ieptec.ac.gov.br", phone: "+55 68 99999-9999", date: "2028-02-16", startTime: "10:00", endTime: "10:00", purpose: "Gravação de aula" }).success, false);
});

test("rejeita datas inexistentes no calendário", () => {
  assert.equal(appointmentSchema.safeParse({ requesterName: "Maria Silva", department: "Comunicação", email: "maria@ieptec.ac.gov.br", phone: "+55 68 99999-9999", date: "2028-02-31", startTime: "10:00", endTime: "11:00", purpose: "Gravação de aula" }).success, false);
});

test("rejeita solicitações no passado", () => {
  assert.throws(
    () => validateRequestedWindow("2020-01-01", "08:00", "09:00", new Date("2028-01-01T00:00:00.000Z")),
    /passado/
  );
});
