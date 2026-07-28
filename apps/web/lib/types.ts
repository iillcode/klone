export interface Project {
  id: string;
  service_id: string;
  service_name: string;
  title: string;
  user_inputs: Record<string, string>;
  generated_prompt: string;
  created_at: string;
}
