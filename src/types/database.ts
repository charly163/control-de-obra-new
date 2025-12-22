export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id_empresa: string
          nombre: string
          cuit: string | null
          telefono: string | null
          email: string | null
          direccion: string | null
          rubro_principal: string | null
        }
        Insert: {
          id_empresa?: string
          nombre: string
          cuit?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          rubro_principal?: string | null
        }
        Update: {
          id_empresa?: string
          nombre?: string
          cuit?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          rubro_principal?: string | null
        }
      }
      escuelas: {
        Row: {
          id_escuela: string
          nombre: string
          direccion: string | null
          id_zona: string
        }
        Insert: {
          id_escuela?: string
          nombre: string
          direccion?: string | null
          id_zona: string
        }
        Update: {
          id_escuela?: string
          nombre?: string
          direccion?: string | null
          id_zona?: string
        }
      }
      inspecciones: {
        Row: {
          id_inspeccion: string
          fecha: string
          id_tarea: string
          id_empresa: string | null
          id_inspector: string | null
          avance_acumulado_porcentaje: number | null
          cantidad_ejecutada: number | null
          observaciones_inspeccion: string | null
          foto_url: string | null
          creado_en: string
        }
        Insert: {
          id_inspeccion?: string
          fecha: string
          id_tarea: string
          id_empresa?: string | null
          id_inspector?: string | null
          avance_acumulado_porcentaje?: number | null
          cantidad_ejecutada?: number | null
          observaciones_inspeccion?: string | null
          foto_url?: string | null
          creado_en?: string
        }
        Update: {
          id_inspeccion?: string
          fecha?: string
          id_tarea?: string
          id_empresa?: string | null
          id_inspector?: string | null
          avance_acumulado_porcentaje?: number | null
          cantidad_ejecutada?: number | null
          observaciones_inspeccion?: string | null
          foto_url?: string | null
          creado_en?: string
        }
      }
      inspectores: {
        Row: {
          id_inspector: string
          nombre: string
          email: string | null
          telefono: string | null
          rol: 'inspector' | 'jefe'
        }
        Insert: {
          id_inspector?: string
          nombre: string
          email?: string | null
          telefono?: string | null
          rol?: 'inspector' | 'jefe'
        }
        Update: {
          id_inspector?: string
          nombre?: string
          email?: string | null
          telefono?: string | null
          rol?: 'inspector' | 'jefe'
        }
      }
      obras: {
        Row: {
          id_obra: string | null
          id_escuela: string | null
          fecha_inicio_prevista: string | null
          fecha_fin_prevista: string | null
          fecha_inicio_real: string | null
          fecha_fin_real: string | null
          estado: 'planificada' | 'en_progreso' | 'finalizada' | 'suspendida' | 'pausada' | 'cancelada'
          nombre: string | null
          numero_obra: string | null
          nro_de_expte: string | null
        }
        Insert: {
          id_obra?: string | null
          id_escuela?: string | null
          fecha_inicio_prevista?: string | null
          fecha_fin_prevista?: string | null
          fecha_inicio_real?: string | null
          fecha_fin_real?: string | null
          estado?: 'planificada' | 'en_progreso' | 'finalizada' | 'suspendida' | 'pausada' | 'cancelada'
          nombre?: string | null
          numero_obra?: string | null
          nro_de_expte?: string | null
        }
        Update: {
          id_obra?: string | null
          id_escuela?: string | null
          fecha_inicio_prevista?: string | null
          fecha_fin_prevista?: string | null
          fecha_inicio_real?: string | null
          fecha_fin_real?: string | null
          estado?: 'planificada' | 'en_progreso' | 'finalizada' | 'suspendida' | 'pausada' | 'cancelada'
          nombre?: string | null
          numero_obra?: string | null
          nro_de_expte?: string | null
        }
      }
      rubros: {
        Row: {
          id_rubro: string
          nombre: string
        }
        Insert: {
          id_rubro?: string
          nombre: string
        }
        Update: {
          id_rubro?: string
          nombre?: string
        }
      }
      tareas: {
        Row: {
          id_tarea: string
          id_obra: string
          id_rubro: string
          id_empresa: string | null
          descripcion: string
          unidad_medida: string | null
          cantidad_total: number | null
          cantidad_inicial: number | null
          presupuesto: number | null
          avance_planificado_porcentaje: number | null
          observaciones_plan: string | null
          fecha_inicio_prevista: string | null
          fecha_fin_prevista: string | null
          avance: number
          nombre: string | null
          estado: 'pendiente' | 'en_progreso' | 'bloqueada' | 'completada' | null
          fecha_inicio: string | null
          fecha_fin: string | null
          prioridad: string | null
        }
        Insert: {
          id_tarea?: string
          id_obra: string
          id_rubro: string
          id_empresa?: string | null
          descripcion: string
          unidad_medida?: string | null
          cantidad_total?: number | null
          cantidad_inicial?: number | null
          presupuesto?: number | null
          avance_planificado_porcentaje?: number | null
          observaciones_plan?: string | null
          fecha_inicio_prevista?: string | null
          fecha_fin_prevista?: string | null
          avance?: number
          nombre?: string | null
          estado?: 'pendiente' | 'en_progreso' | 'bloqueada' | 'completada' | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          prioridad?: string | null
        }
        Update: {
          id_tarea?: string
          id_obra?: string
          id_rubro?: string
          id_empresa?: string | null
          descripcion?: string
          unidad_medida?: string | null
          cantidad_total?: number | null
          cantidad_inicial?: number | null
          presupuesto?: number | null
          avance_planificado_porcentaje?: number | null
          observaciones_plan?: string | null
          fecha_inicio_prevista?: string | null
          fecha_fin_prevista?: string | null
          avance?: number
          nombre?: string | null
          estado?: 'pendiente' | 'en_progreso' | 'bloqueada' | 'completada' | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          prioridad?: string | null
        }
      }
      usuarios: {
        Row: {
          id: string
          nombre: string
          email: string
          rol: 'user' | 'admin' | 'responsable'
          creado_en: string
          telefono: string | null
        }
        Insert: {
          id?: string
          nombre: string
          email: string
          rol: 'user' | 'admin' | 'responsable'
          creado_en?: string
          telefono?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          email?: string
          rol?: 'user' | 'admin' | 'responsable'
          creado_en?: string
          telefono?: string | null
        }
      }
      zonas: {
        Row: {
          id_zona: string
          nombre: string
        }
        Insert: {
          id_zona?: string
          nombre: string
        }
        Update: {
          id_zona?: string
          nombre?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
