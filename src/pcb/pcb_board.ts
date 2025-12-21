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

// Common properties base for all board shapes (internal)
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

// Rectangular Board
export const pcb_board_rect = pcb_board_base.extend({
  shape: z.literal("rect"),
  width: length,
  height: length,
})
export type PcbBoardRectInput = z.input<typeof pcb_board_rect>
type InferredPcbBoardRect = z.infer<typeof pcb_board_rect>
/**
 * Defines a rectangular board outline of the PCB.
 */
export interface PcbBoardRect {
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
  shape: "rect"
  width: Length
  height: Length
}
expectTypesMatch<PcbBoardRect, InferredPcbBoardRect>(true)

// Polygon Board
export const pcb_board_polygon = pcb_board_base.extend({
  shape: z.literal("polygon"),
  outline: z.array(point),
})
export type PcbBoardPolygonInput = z.input<typeof pcb_board_polygon>
type InferredPcbBoardPolygon = z.infer<typeof pcb_board_polygon>
/**
 * Defines a polygonal board outline of the PCB.
 */
export interface PcbBoardPolygon {
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
  shape: "polygon"
  outline: Point[]
}
expectTypesMatch<PcbBoardPolygon, InferredPcbBoardPolygon>(true)

// Union of all board shapes
const pcb_board_shape_union = z.discriminatedUnion("shape", [
  pcb_board_rect,
  pcb_board_polygon,
])

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
  }, pcb_board_shape_union)
  .describe("Defines the board outline of the PCB.")

export type PcbBoardInput = z.input<typeof pcb_board>
export type PcbBoard = PcbBoardRect | PcbBoardPolygon

type InferredPcbBoard = z.infer<typeof pcb_board>
expectTypesMatch<PcbBoard, InferredPcbBoard>(true)

/**
 * @deprecated use PcbBoard
 */
export type PCBBoard = PcbBoard
