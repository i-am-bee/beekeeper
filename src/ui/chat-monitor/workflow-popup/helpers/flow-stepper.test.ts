import { describe, expect, it } from "vitest";
import { FlowStepper } from "./flow-stepper.js";

describe("Flow Stepper ", () => {
  describe("Moves", () => {
    it("single step", () => {
      const stepper = new FlowStepper([{ attr: "name" }], () => ({
        name: "my_name",
      }));
      expect(stepper.currentPath).toEqual("name");

      stepper.forward();
      // No change in path after forward on single step
      expect(stepper.currentPath).toEqual("name");

      stepper.backward();
      // No change in path after backward on single step
      expect(stepper.currentPath).toEqual("name");
    });

    it("forward step on same level", () => {
      const stepper = new FlowStepper(
        [{ attr: "name" }, { attr: "age" }],
        () => ({ name: "my_name", age: "my_age" }),
      );

      expect(stepper.currentPath).toEqual("name");

      stepper.forward();
      expect(stepper.currentPath).toEqual("age");
      stepper.forward();
      expect(stepper.currentPath).toEqual("age");
    });

    it("prevent forward step on non-existing value", () => {
      const stepper = new FlowStepper(
        [{ attr: "name" }, { attr: "age" }],
        () => ({ name: "my_name" }),
      );

      expect(stepper.currentPath).toEqual("name");

      // Attempting to move forward when 'age' is not available
      stepper.forward();
      expect(stepper.currentPath).toEqual("name");
    });

    it("forward and backward step on same level", () => {
      const stepper = new FlowStepper(
        [{ attr: "name" }, { attr: "age" }],
        () => ({ name: "my_name", age: "my_age" }),
      );

      expect(stepper.currentPath).toEqual("name");

      stepper.forward();
      expect(stepper.currentPath).toEqual("age");
      stepper.forward();
      expect(stepper.currentPath).toEqual("age");

      stepper.backward();
      expect(stepper.currentPath).toEqual("name");
      stepper.backward();
      expect(stepper.currentPath).toEqual("name");
    });

    it("forward step on nested flow", () => {
      const stepper = new FlowStepper(
        [
          { attr: "name" },
          { attr: "address", flow: [{ attr: "street" }, { attr: "city" }] },
          { attr: "details", flow: [{ attr: "age" }] },
          { attr: "signature" },
        ],
        () => ({
          name: "my_name",
          address: { street: "my_street", city: "my_city" },
          age: "my_age",
        }),
      );

      // expect(stepper.currentPath).toEqual("name");

      stepper.forward();
      expect(stepper.currentPath).toEqual("address.street");

      stepper.forward();
      expect(stepper.currentPath).toEqual("address.city");

      stepper.forward();
      // Should not move forward to 'details.age' as it is not available
      expect(stepper.currentPath).toEqual("address.city");
    });

    it("forward and backward step on nested array", () => {
      const stepper = new FlowStepper(
        [
          { attr: "name" },
          {
            attr: "adresses",
            array: true,
            flow: [{ attr: "street" }, { attr: "city" }],
          },
          { attr: "details", flow: [{ attr: "age" }] },
          { attr: "signature" },
        ],
        () => ({
          name: "my_name",
          adresses: [
            { street: "my_street1", city: "my_city1" },
            { street: "my_street2", city: "my_city2" },
          ],
          details: {
            age: "my_age",
          },
          signature: "my_signature",
        }),
      );

      // expect(stepper.currentPath).toEqual("name");

      stepper.forward();
      expect(stepper.currentPath).toEqual("adresses[0].street");

      stepper.forward();
      expect(stepper.currentPath).toEqual("adresses[0].city");

      stepper.forward();
      expect(stepper.currentPath).toEqual("adresses[1].street");

      stepper.forward();
      expect(stepper.currentPath).toEqual("adresses[1].city");

      stepper.forward();
      expect(stepper.currentPath).toEqual("details.age");

      stepper.forward();
      expect(stepper.currentPath).toEqual("signature");
    });

    it("forward and backward step on nested array", () => {
      const stepper = new FlowStepper(
        [
          { attr: "name" },
          {
            attr: "adresses",
            array: true,
            flow: [{ attr: "street" }, { attr: "city" }],
          },
          { attr: "details", flow: [{ attr: "age" }] },
          { attr: "signature" },
        ],
        () => ({
          name: "my_name",
          adresses: [
            { street: "my_street1", city: "my_city1" },
            { street: "my_street2", city: "my_city2" },
          ],
          details: {
            age: "my_age",
          },
        }),
      );

      expect(stepper.currentPath).toEqual("name");

      stepper.forward();
      expect(stepper.currentPath).toEqual("adresses[0].street");

      stepper.forward();
      expect(stepper.currentPath).toEqual("adresses[0].city");

      stepper.forward();
      expect(stepper.currentPath).toEqual("adresses[1].street");

      stepper.forward();
      expect(stepper.currentPath).toEqual("adresses[1].city");

      stepper.forward();
      expect(stepper.currentPath).toEqual("details.age");

      stepper.forward();
      expect(stepper.currentPath).toEqual("details.age");

      stepper.backward();
      expect(stepper.currentPath).toEqual("adresses[1].city");

      stepper.backward();
      expect(stepper.currentPath).toEqual("adresses[1].street");

      stepper.backward();
      expect(stepper.currentPath).toEqual("adresses[0].city");

      stepper.backward();
      expect(stepper.currentPath).toEqual("adresses[0].street");

      stepper.backward();
      expect(stepper.currentPath).toEqual("name");
    });
  });
});
