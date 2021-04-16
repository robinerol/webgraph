import { InternalUtils, Utils } from "../src/Utils/index";

describe("test external util functions", () => {
  describe("getNodeSizeForValue", () => {
    it("should return same sizes", () => {
      const score1 = 15;
      const score2 = 17;
      const score3 = 20;
      const min = 5;
      const max = 20;
      const minSize = 10;
      const maxSize = 20;
      const steps = 2;

      const res1 = Utils.getNodeSizeForValue(
        score1,
        min,
        max,
        steps,
        minSize,
        maxSize
      );

      const res2 = Utils.getNodeSizeForValue(
        score2,
        min,
        max,
        steps,
        minSize,
        maxSize
      );

      const res3 = Utils.getNodeSizeForValue(
        score3,
        min,
        max,
        steps,
        minSize,
        maxSize
      );

      expect(res1).toEqual(res2);
      expect(res2).toEqual(res3);

      expect(res1).toEqual(maxSize);
      expect(res2).toEqual(maxSize);
      expect(res3).toEqual(maxSize);
    });

    it("should return different sizes", () => {
      const score1 = 5;
      const score2 = 10;
      const score3 = 15;
      const min = 5;
      const max = 15;
      const minSize = 10;
      const maxSize = 20;
      const steps = 3;

      const res1 = Utils.getNodeSizeForValue(
        score1,
        min,
        max,
        steps,
        minSize,
        maxSize
      );

      const res2 = Utils.getNodeSizeForValue(
        score2,
        min,
        max,
        steps,
        minSize,
        maxSize
      );

      const res3 = Utils.getNodeSizeForValue(
        score3,
        min,
        max,
        steps,
        minSize,
        maxSize
      );

      expect(res1).not.toEqual(res2);
      expect(res2).not.toEqual(res3);
      expect(res3).not.toEqual(res1);

      expect(res1).toEqual(minSize);
      expect(res2).not.toEqual(minSize);
      expect(res2).not.toEqual(maxSize);
      expect(res3).toEqual(maxSize);
    });
  });

  describe("getNodeColorForValue", () => {
    const colors = ["#291627", "#292718", "#291027"];

    it("should return same color", () => {
      const val1 = 2009;
      const val2 = 2010;
      const minVal = 1990;
      const maxVal = 2010;

      const res1 = Utils.getNodeColorForValue(val1, minVal, maxVal, colors);
      const res2 = Utils.getNodeColorForValue(val2, minVal, maxVal, colors);

      expect(res1).toEqual(res2);
      expect(res1).toEqual(colors[2]);
    });

    it("should return different colors", () => {
      const val1 = 2009;
      const val2 = 2010;
      const val3 = 1991;
      const val4 = 2001;
      const minVal = 1990;
      const maxVal = 2010;

      const res1 = Utils.getNodeColorForValue(val1, minVal, maxVal, colors);
      const res2 = Utils.getNodeColorForValue(val2, minVal, maxVal, colors);
      const res3 = Utils.getNodeColorForValue(val3, minVal, maxVal, colors);
      const res4 = Utils.getNodeColorForValue(val4, minVal, maxVal, colors);

      expect(res1).toEqual(res2);
      expect(res3).toEqual(colors[0]);
      expect(res4).toEqual(colors[1]);
    });
  });
});

describe("test internal util functions", () => {
  const params = {
    visibleNodes: ["n1", "n2", "n3", "n4"],
    cache: {
      n1: {
        color: "#BBBDF6",
        hidden: false,
        important: false,
        label: "abc, 2018",
        size: 10,
        type: "",
        x: 0.1,
        y: 0.2,
        cluster: 0,
      },
      n2: {
        color: "#DF6BBB",
        hidden: false,
        important: true,
        label: "def, 2017",
        size: 8,
        type: "",
        x: 0.3,
        y: 0.4,
        cluster: 1,
      },
      n3: {
        color: "#BDFBB6",
        hidden: false,
        important: true,
        label: "ghi, 2016",
        size: 8,
        type: "",
        x: 0.5,
        y: 0.6,
        cluster: 2,
      },
      n4: {
        color: "#BF6BBD",
        hidden: false,
        important: false,
        label: "jkl, 2015",
        size: 6,
        type: "",
        x: 0.7,
        y: 0.8,
        cluster: 3,
      },
    },
  };

  it("should return all", () => {
    expect(InternalUtils.labelSelectorAll(params)).toHaveLength(
      params.visibleNodes.length
    );
  });

  it("should return only important", () => {
    expect(InternalUtils.labelSelectorImportant(params)).toHaveLength(2);
  });
});
