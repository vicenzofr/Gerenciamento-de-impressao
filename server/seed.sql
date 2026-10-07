-- Exemplos iniciais da interface, inseridos somente na criação do banco.
INSERT INTO printers (id, name, spec) VALUES
  ('t1', 'Ender 3 Pro', 'FDM • 220x220mm'),
  ('t2', 'Ender 3 V2', 'FDM • 220x220mm'),
  ('t3', 'CR-10 Max', 'FDM • 450x450mm');

INSERT INTO print_jobs (id, file_name, printer_id, status, duration_minutes, filament, weight_grams, priority) VALUES
  ('q1', 'engrenagem_helice_v2.gcode', 't2', 'QUEUED', 285, 'PETG XT', 120, 'ALTA'),
  ('q2', 'suporte_filamento_reforcado.gcode', 't1', 'QUEUED', 312, 'PLA Premium', 180, 'MEDIA'),
  ('q3', 'case_mini_pc_rpi5.gcode', NULL, 'QUEUED', 450, 'ABS Pro', 210, 'AGENDADA');
INSERT INTO print_jobs (id, file_name, printer_id, status, duration_minutes, progress, elapsed_minutes, nozzle_temp, bed_temp) VALUES
  ('p1', 'mascara_cyberpunk_face.gcode', 't3', 'PRODUCING', 635, 78, 495, 220, 68),
  ('p2', 'chassi_robo_explorador_A.gcode', 't1', 'PRODUCING', 310, 42, 130, 240, 80);
INSERT INTO print_jobs (id, file_name, printer_id, status, duration_minutes, verify_status) VALUES
  ('v1', 'vaso_geometrico_decorativo.gcode', 't2', 'VERIFY', 580, 'INSPECAO_PENDENTE'),
  ('v2', 'braco_robotico_articulado.gcode', 't3', 'VERIFY', 862, 'RETIRADA_PRONTA');

INSERT INTO timeline_blocks (id, printer_id, job_id, label, start_minute, end_minute, color, auto_scheduled) VALUES
  ('b1', 't1', 'p2', 'chassi_robo_explorador_A.gcode', 480, 711, 'rust', 0),
  ('b2', 't1', 'q2', 'suporte_filamento_reforcado.gcode', 780, 1020, 'navy', 0),
  ('b3', 't2', 'q1', 'engrenagem_helice_v2.gcode', 540, 810, 'teal', 0),
  ('b4', 't2', NULL, 'teste_calibracao_bico.gcode', 900, 1080, 'green', 0),
  ('b5', 't3', 'p1', 'mascara_cyberpunk_face.gcode', 480, 975, 'amber', 1);
