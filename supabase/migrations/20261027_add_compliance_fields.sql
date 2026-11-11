-- LSY Driver Manager: 運行日報の法定記録項目追加
-- Supabase SQL Editorで一度だけ実行してください。
-- 既存の案件設定地点(start_location/end_location)と、実際の運行地点を分けて保存します。
alter table public.daily_reports
  add column if not exists actual_start_location text,
  add column if not exists actual_end_location text,
  add column if not exists main_transit_points text,
  add column if not exists break_sleep_records text,
  add column if not exists driver_change_records text,
  add column if not exists waiting_records text,
  add column if not exists cargo_handling_records text,
  add column if not exists incident_records text;

comment on column public.daily_reports.actual_start_location is '実際の業務開始地点（運行記録）';
comment on column public.daily_reports.actual_end_location is '実際の業務終了地点（運行記録）';
comment on column public.daily_reports.main_transit_points is '主な経過地点（運行記録）';
comment on column public.daily_reports.break_sleep_records is '休憩または睡眠の地点・日時。複数ある場合はすべて記録';
comment on column public.daily_reports.driver_change_records is '業務を交替した場合の地点・日時';
comment on column public.daily_reports.waiting_records is '荷主都合で集貨・配達地点に30分以上待機した場合の詳細';
comment on column public.daily_reports.cargo_handling_records is '荷役作業・附帯業務の地点・内容・開始終了日時等';
comment on column public.daily_reports.incident_records is '事故・異常・著しい遅延等の補足記録。法定の事故記録簿の代替ではない';
