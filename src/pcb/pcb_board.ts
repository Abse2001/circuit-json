import { z } from "zod"
import {
  point,
  type Point,
  getZodPrefixedIdWithDefault,
  ninePointAnchor,
  type NinePointAnchor,
} from "src/common"
import { length, type Length } from "src/units"
import { expectTypesMatch } from "src/utils/expect-types-match"

// Base properties shared by all boards
const pcb_board_base = z.object({
  type: z.literal("pcb_board"),
  pcb_board_id: getZodPrefixedIdWithDefault("pcb_board"),
  pcb_panel_id: z.string().optional(),
  is_subcircuit: z.boolean().optional(),
  subcircuit_id: z.string().optional(),
  center: point,
  display_offset_x: z
    .string()
    .optional()
    .describe(
      "How to display the x offset for this board, usually corresponding with how the user specified it",
    ),
  display_offset_y: z
    .string()
    .optional()
    .describe(
      "How to display the y offset for this board, usually corresponding with how the user specified it",
    ),
  thickness: length.optional().default(1.4),
  num_layers: z.number().optional().default(4),
  material: z.enum(["fr4", "fr1"]).default("fr4"),
  anchor_position: point.optional(),
  anchor_alignment: ninePointAnchor.optional(),
  position_mode: z.enum(["relative_to_panel_anchor", "none"]).optional(),
})

// Shape-specific properties (discriminated by "shape")
const pcb_board_rect_properties = z.object({
  shape: z.literal("rect"),
  width: length,
  height: length,
})

const pcb_board_polygon_properties = z.object({
  shape: z.literal("polygon"),
  outline: z.array(point),
})

const pcb_board_shape_properties = z.discriminatedUnion("shape", [
  pcb_board_rect_properties,
  pcb_board_polygon_properties,
])

// Combined schema using intersection
const pcb_board_combined = z.intersection(
  pcb_board_base,
  pcb_board_shape_properties,
)

export const pcb_board = z
  .preprocess((input) => {
    if (input && typeof input === "object" && !Array.isArray(input)) {
      const boardInput = input as Record<string, unknown>
      const hasWidthHeight =
        boardInput.width !== undefined || boardInput.height !== undefined
      const hasOutline = boardInput.outline !== undefined

      if (hasWidthHeight && hasOutline) {
        throw new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            message:
              "Cannot specify both width/height and outline. Use width/height for rectangular boards or outline for polygon boards.",
            path: [],
          },
        ])
      }

      // Auto-derive shape from provided properties
      if (!boardInput.shape) {
        if (hasOutline) {
          return { ...boardInput, shape: "polygon" }
        }
        if (hasWidthHeight) {
          return { ...boardInput, shape: "rect" }
        }
      }
      return boardInput
    }
    return input
  }, pcb_board_combined)
  .describe("Defines the board outline of the PCB.")

// Base interface shared by all boards
interface PcbBoardBase {
  type: "pcb_board"
  pcb_board_id: string
  pcb_panel_id?: string
  is_subcircuit?: boolean
  subcircuit_id?: string
  display_offset_x?: string
  display_offset_y?: string
  thickness: Length
  num_layers: number
  center: Point
  material: "fr4" | "fr1"
  anchor_position?: Point
  anchor_alignment?: NinePointAnchor
  position_mode?: "relative_to_panel_anchor" | "none"
}

// Shape-specific property interfaces
interface PcbBoardRectProperties {
  shape: "rect"
  width: Length
  height: Length
}

interface PcbBoardPolygonProperties {
  shape: "polygon"
  outline: Point[]
}

type PcbBoardShapeProperties =
  | PcbBoardRectProperties
  | PcbBoardPolygonProperties

/**
 * Defines a rectangular board outline of the PCB.
 */
export type PcbBoardRect = PcbBoardBase & PcbBoardRectProperties

/**
 * Defines a polygonal board outline of the PCB.
 */
export type PcbBoardPolygon = PcbBoardBase & PcbBoardPolygonProperties

/**
 * Defines the board outline of the PCB.
 */
export type PcbBoard = PcbBoardBase & PcbBoardShapeProperties

export type PcbBoardInput = z.input<typeof pcb_board>
type InferredPcbBoard = z.infer<typeof pcb_board>

expectTypesMatch<PcbBoard, InferredPcbBoard>(true)

/**
 * @deprecated use PcbBoard
 */
export type PCBBoard = PcbBoard
