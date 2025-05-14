import { describe, expect, it } from "vitest";
import { pb } from "./pattern-builder.js";

describe("PatternBuilder", () => {
  it("matches simple text", () => {
    expect("Say hello to the world").toMatchPattern(pb().text("hello"));
    expect("No greetings here").not.toMatchPattern(pb().text("hello"));
  });

  it("respects sequence order", () => {
    const pattern = pb().text("start").text("middle").text("end");
    expect("start — then middle — and finally end").toMatchPattern(pattern);
    expect("middle before start and end").not.toMatchPattern(pattern);
  });

  it("supports alternation (alt)", () => {
    const pattern = pb().alt("apple", "banana");
    expect("I ate a banana").toMatchPattern(pattern);
    expect("Just grapes").not.toMatchPattern(pattern);
  });

  it("supports negation (not)", () => {
    const pattern = pb().text("summary").sep().not("draft");
    expect("summary of final report").toMatchPattern(pattern);
    expect("summary of draft version").not.toMatchPattern(pattern);
  });

  it("supports price and percent", () => {
    const pattern = pb().price(299).percent(20);
    expect("Only €299 with 20% off!").toMatchPattern(pattern);
    expect("Only €199 with 10% off").not.toMatchPattern(pattern);
  });

  it("supports time", () => {
    expect("Scheduled for 5:00 AM").toMatchPattern(pb().time(5));
    expect("Meeting at 05:20").toMatchPattern(pb().time(5, 20));
    expect("Ends 17:20:31").toMatchPattern(pb().time(17, 20, 31));
  });

  it("supports raw regex", () => {
    const pattern = pb().raw("\\d{4}-\\d{2}-\\d{2}");
    expect("Event date: 2024-05-01").toMatchPattern(pattern);
    expect("No date here").not.toMatchPattern(pattern);
  });

  it("supports explain()", () => {
    const description = pb().text("hello").not("bad").explain();
    expect(description).toMatch(/Must contain text: "hello"/);
    expect(description).toMatch(/Must NOT contain/);
  });
});

describe("PatternBuilder › seq()", () => {
  it("matches basic sequence in order", () => {
    const pattern = pb().text("start").text("middle").text("end");
    expect("start → middle → end").toMatchPattern(pattern);
    expect("middle → start → end").not.toMatchPattern(pattern);
  });

  it("advances correctly through wildcard", () => {
    const pattern = pb().text("hello").sep().text("world");
    expect("hello amazing world").toMatchPattern(pattern);
    expect("world hello").not.toMatchPattern(pattern);
  });

  it("fails when sequence is broken", () => {
    const pattern = pb().text("first").text("second").text("third");
    expect("first third second").not.toMatchPattern(pattern);
    expect("second first third").not.toMatchPattern(pattern);
  });

  it("supports sequence with not()", () => {
    const pattern = pb().text("begin").not("fail").text("end");
    expect("begin end").toMatchPattern(pattern);
    expect("begin fail end").not.toMatchPattern(pattern);
  });

  it("matches with multiple types in sequence", () => {
    const pattern = pb().text("price").price(499).percent(20).text("deal");
    expect("price €499 20% deal").toMatchPattern(pattern);
    expect("price 20% €499 deal").not.toMatchPattern(pattern); // wrong order
  });

  it("works with alt() inside a sequence", () => {
    const pattern = pb().alt("buy", "order").text("now");
    expect("buy now").toMatchPattern(pattern);
    expect("order now").toMatchPattern(pattern);
    expect("call now").not.toMatchPattern(pattern);
  });

  it("matches with time only", () => {
    const pattern = pb().time(5);
    expect("Wake at 05:00").toMatchPattern(pattern);
    expect("05:00 AM").toMatchPattern(pattern);
    expect("5:00").toMatchPattern(pattern);
  });

  it("matches sequence with time", () => {
    const pattern = pb().text("wake").sep().time(5, 30).text("ready");
    expect("wake at 5:30 AM — ready").toMatchPattern(pattern);
    expect("ready wake 5:30").not.toMatchPattern(pattern); // wrong order
  });

  it("matches time with seconds", () => {
    const pattern = pb().time(17, 20, 31);
    expect("starts at 17:20:31").toMatchPattern(pattern);
    expect("5:20:31 PM").not.toMatchPattern(pattern); // 5 ≠ 17
  });

  it("does not match if any part of the sequence fails", () => {
    const pattern = pb().text("one").text("two").text("three");
    expect("one two").not.toMatchPattern(pattern); // missing third
    expect("two three").not.toMatchPattern(pattern); // missing first
  });
});
