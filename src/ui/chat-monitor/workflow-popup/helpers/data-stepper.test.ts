import { describe, expect, it } from "vitest";
import { DataStepper } from "./data-stepper.js";

describe("Data Stepper ", () => {
  it("walktrough", () => {
    const stepper = new DataStepper([
      {
        attr: "name",
      },
      {
        attr: "addresses",
        array: true,
        flow: [
          {
            attr: 0,
            flow: [
              {
                attr: "street",
              },
              {
                attr: "city",
              },
            ],
          },
          {
            attr: 1,
            flow: [
              {
                attr: "street",
              },
              {
                attr: "city",
              },
            ],
          },
        ],
      },
      {
        attr: "details",
        flow: [
          {
            attr: "age",
          },
        ],
      },
    ]);
    expect(stepper.currentPath).toEqual("name");
    expect(stepper.isBackwardPossible).toBeFalsy();
    expect(stepper.isForwardPossible).toBeTruthy();

    stepper.backward();
    expect(stepper.currentPath).toEqual("name");

    stepper.forward();
    expect(stepper.currentPath).toEqual("addresses[0].street");

    stepper.forward();
    expect(stepper.currentPath).toEqual("addresses[0].city");

    stepper.forward();
    expect(stepper.currentPath).toEqual("addresses[1].street");

    stepper.forward();
    expect(stepper.currentPath).toEqual("addresses[1].city");
    expect(stepper.isForwardPossible).toBeTruthy();

    stepper.forward();
    expect(stepper.currentPath).toEqual("details.age");
    expect(stepper.isForwardPossible).toBeFalsy();

    stepper.forward();
    expect(stepper.currentPath).toEqual("details.age");

    stepper.backward();
    expect(stepper.currentPath).toEqual("addresses[1].city");

    stepper.backward();
    expect(stepper.currentPath).toEqual("addresses[1].street");

    stepper.backward();
    expect(stepper.currentPath).toEqual("addresses[0].city");

    stepper.backward();
    expect(stepper.currentPath).toEqual("addresses[0].street");
    expect(stepper.isForwardPossible).toBeTruthy();

    stepper.backward();
    expect(stepper.currentPath).toEqual("name");
    expect(stepper.isBackwardPossible).toBeFalsy();

    stepper.backward();
    expect(stepper.currentPath).toEqual("name");
    expect(stepper.isBackwardPossible).toBeFalsy();
  });
});
