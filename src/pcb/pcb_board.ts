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

const pcb_board_rect_shape = z
  .object({
    type: z.literal("pcb_board"),
    pcb_board_id: getZodPrefixedIdWithDefault("pcb_board"),
    pcb_panel_id: z.string().optional(),
    is_subcircuit: z.boolean().optional(),
    subcircuit_id: z.string().optional(),
    width: length,
    height: length,
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
    shape: z.literal("rect"),
    material: z.enum(["fr4", "fr1"]).default("fr4"),
    anchor_position: point.optional(),
    anchor_alignment: ninePointAnchor.optional(),
    position_mode: z.enum(["relative_to_panel_anchor", "none"]).optional(),
  })
  .describe("Defines a rectangular board of the PCB")

const pcb_board_polygon_shape = z
  .object({
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
    outline: z.array(point),
    shape: z.literal("polygon"),
    material: z.enum(["fr4", "fr1"]).default("fr4"),
  })
  .describe("Defines a polygonal board outline of the PCB")

export const pcb_board = z
  .union([pcb_board_rect_shape, pcb_board_polygon_shape])
  .describe("Defines the board outline of the PCB")

/**
 * Defines the board outline of the PCB
 */
export interface PcbBoardRectShape {
  type: "pcb_board"
  pcb_board_id: string
  pcb_panel_id?: string
  is_subcircuit?: boolean
  subcircuit_id?: string
  display_offset_x?: string
  display_offset_y?: string
  width: Length
  height: Length
  thickness: Length
  num_layers: number
  center: Point
  shape: "rect"
  material: "fr4" | "fr1"
  anchor_position?: Point
  anchor_alignment?: NinePointAnchor
  position_mode?: "relative_to_panel_anchor" | "none"
}

export interface PcbBoardPolygonShape {
  type: "pcb_board"
  pcb_board_id: string
  pcb_panel_id?: string
  is_subcircuit?: boolean
  subcircuit_id?: string
  thickness: Length
  display_offset_x?: string
  display_offset_y?: string
  num_layers: number
  center: Point
  outline: Point[]
  shape: "polygon"
  material: "fr4" | "fr1"
}

export type PcbBoard = PcbBoardRectShape | PcbBoardPolygonShape

export type PcbBoardInput = z.input<typeof pcb_board>
type InferredPcbBoard = z.infer<typeof pcb_board>

/**
 * @deprecated use PcbBoard
 */
export type PCBBoard = PcbBoard

expectTypesMatch<PcbBoard, InferredPcbBoard>(true)
