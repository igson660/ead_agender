import assert from "node:assert/strict";
import test from "node:test";
import { getFirstBookableDate, isAvailable, isDateBookable, validateRequestedWindow } from "../lib/scheduling";
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

test("rejeita agendamentos no sábado e no domingo", () => {
  assert.equal(appointmentSchema.safeParse({ requesterName: "Maria Silva", department: "EAD", email: "maria@ieptec.ac.gov.br", phone: "+55 68 99999-9999", date: "2028-02-19", startTime: "10:00", endTime: "11:00", purpose: "Gravação de aula" }).success, false);
  assert.equal(isDateBookable("2028-02-19", new Date("2028-02-15T14:00:00.000Z")), false);
});

test("exige pelo menos 48 horas de antecedência", () => {
  assert.doesNotThrow(() => validateRequestedWindow("2028-02-16", "10:00", "11:00", new Date("2028-02-14T14:00:00.000Z")));
  assert.throws(
    () => validateRequestedWindow("2028-02-16", "10:00", "11:00", new Date("2028-02-14T15:01:00.000Z")),
    /48 horas/
  );
});

test("pula o fim de semana ao calcular a primeira data disponível", () => {
  assert.equal(getFirstBookableDate(new Date("2028-02-17T14:00:00.000Z")), "2028-02-21");
});

test("rejeita solicitações no passado", () => {
  assert.throws(
    () => validateRequestedWindow("2020-01-02", "08:00", "09:00", new Date("2028-01-01T00:00:00.000Z")),
    /passado/
  );
});
