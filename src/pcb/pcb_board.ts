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

export const pcb_board = z
  .object({
    type: z.literal("pcb_board"),
    pcb_board_id: getZodPrefixedIdWithDefault("pcb_board"),
    pcb_panel_id: z.string().optional(),
    is_subcircuit: z.boolean().optional(),
    subcircuit_id: z.string().optional(),
    width: length.optional(),
    height: length.optional(),
    center: point,
    outline: z.array(point).optional(),
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
    shape: z.enum(["rect", "polygon"]).optional(),
    material: z.enum(["fr4", "fr1"]).default("fr4"),
    anchor_position: point.optional(),
    anchor_alignment: ninePointAnchor.optional(),
    position_mode: z.enum(["relative_to_panel_anchor", "none"]).optional(),
  })
  .superRefine((board, ctx) => {
    const hasWidthHeight =
      board.width !== undefined || board.height !== undefined
    const hasOutline = board.outline !== undefined

    if (hasWidthHeight && hasOutline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Cannot specify both width/height and outline. Use width/height for rectangular boards or outline for polygon boards.",
      })
    }
  })
  .transform((board) => {
    // Auto-derive shape from provided properties
    if (!board.shape) {
      if (board.outline) {
        return { ...board, shape: "polygon" as const }
      }
      if (board.width !== undefined && board.height !== undefined) {
        return { ...board, shape: "rect" as const }
      }
    }
    return board
  })
  .describe("Defines the board outline of the PCB")

/**
 * Defines the board outline of the PCB
 */
export interface PcbBoard {
  type: "pcb_board"
  pcb_board_id: string
  pcb_panel_id?: string
  is_subcircuit?: boolean
  subcircuit_id?: string
  display_offset_x?: string
  display_offset_y?: string
  width?: Length
  height?: Length
  thickness: Length
  num_layers: number
  center: Point
  outline?: Point[]
  shape?: "rect" | "polygon"
  material: "fr4" | "fr1"
  anchor_position?: Point
  anchor_alignment?: NinePointAnchor
  position_mode?: "relative_to_panel_anchor" | "none"
}

export type PcbBoardInput = z.input<typeof pcb_board>
type InferredPcbBoard = z.infer<typeof pcb_board>

/**
 * @deprecated use PcbBoard
 */
export type PCBBoard = PcbBoard

expectTypesMatch<PcbBoard, InferredPcbBoard>(true)
