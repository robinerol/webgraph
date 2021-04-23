import { ForceAtlas2LayoutOptions } from "graphology-layout-forceatlas2";
import { CirclePackLayoutOptions } from "graphology-layout/circlepack";
import { CircularLayoutOptions } from "graphology-layout/circular";
import { RandomLayoutOptions } from "graphology-layout/random";

/**
 * Enum representing the available layouts for the graph.
 *
 * {@label Layout}
 */
enum Layout {
  /**
   * Arranges the nodes randomly.
   *
   * @see {@link https://github.com/graphology/graphology-layout#readme} for more details
   *
   * {@label RANDOM}
   */
  RANDOM = "random",

  /**
   * Arranges the nodes in a circle.
   *
   * @see {@link https://github.com/graphology/graphology-layout#readme} for more details
   *
   * {@label CIRCULAR}
   */
  CIRCULAR = "circular",

  /**
   * Arranges the nodes as a bubble chart, according to specified attributes.
   *
   * @see {@link https://github.com/graphology/graphology-layout#readme} for more details
   *
   * {@label CIRCLEPACK}
   */
  CIRCLEPACK = "circlepack",

  /**
   * Doesn't affect the arrangement of the nodes. To be used if there should no further layout
   * processing be applied to the nodes. Beware that the x and y attributes of your nodes might be empty.
   *
   * {@label PREDEFINED}
   */
  PREDEFINED = "predefined",

  /**
   * Arranges the nodes according the the ForceAtlas2 algorithm.
   *
   * @see {@link https://github.com/graphology/graphology-layout-forceatlas2#readme} for more details
   *
   * {@label FORCEATLAS2}
   */
  FORCEATLAS2 = "forceatlas2",
}

/**
 * Represents a placeholder type for the configurations of the {@link Layout.PREDEFINED} layout.
 * There are no options for the {@link Layout.PREDEFINED} layout, since no layouting is performed
 * when selecting the {@link Layout.PREDEFINED} layout.
 *
 * {@label PredefinedLayoutOptions}
 */
type PredefinedLayoutOptions = Record<string, never>;

/**
 * Interface extending the {@link ForceAtlas2LayoutOptions} by a [preAppliedLayout],
 * which is defining the {@link Layout} that should be applied before applying the
 * {@link Layout.FORCEATLAS2}. A matching {@link ILayoutConfiguration} for the pre-applied
 * layout can be provided too.
 *
 * {@label IExtendedForceAtlas2LayoutOptions}
 */
interface IExtendedForceAtlas2LayoutOptions extends ForceAtlas2LayoutOptions {
  preAppliedLayout?: Layout;
  preAppliedLayoutOptions?: ILayoutConfiguration;
}

/**
 * Represents the default amount of iterations used when applying the {@link Layout.FORCEATLAS2}
 * layout.
 *
 * {@label DEFAULT_FORCEATLAS2_ITERATIONS}
 */
const DEFAULT_FORCEATLAS2_ITERATIONS = 50;

/**
 * Represents the default layout options used when applying the {@link Layout.FORCEATLAS2} layout.
 * The default amount of iterations is defined in {@link DEFAULT_FORCEATLAS2_ITERATIONS}. The default
 * layout to be applied before running the {@link Layout.FORCEATLAS2} is {@link Layout.CIRCLEPACK}.
 */
const DEFAULT_FORCEATLAS2_LAYOUT_OPTIONS: IExtendedForceAtlas2LayoutOptions = {
  iterations: DEFAULT_FORCEATLAS2_ITERATIONS,
  preAppliedLayout: Layout.CIRCLEPACK,
};

/**
 * Interface for the layout configuration.
 *
 * {@label ILayoutConfiguration}
 */
interface ILayoutConfiguration {
  randomLayoutOptions?: RandomLayoutOptions;
  circularLayoutOptions?: CircularLayoutOptions;
  circlePackLayoutOptions?: CirclePackLayoutOptions;
  forceAtlas2LayoutOptions?: IExtendedForceAtlas2LayoutOptions;
  predefinedLayoutOptions?: PredefinedLayoutOptions;
}

export {
  Layout,
  ILayoutConfiguration,
  DEFAULT_FORCEATLAS2_LAYOUT_OPTIONS,
  DEFAULT_FORCEATLAS2_ITERATIONS,
};
