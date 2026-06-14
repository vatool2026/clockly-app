import { supabase } from '../lib/supabase';

export const logAudit = async (
  userId: string,
  companyId: string,
  action: string,
  tableName: string,
  recordId: string,
  oldData: any,
  newData: any
) => {
  try {
    await supabase.from('audit_log').insert({
      company_id: companyId,
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      new_data: newData
    });
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
};
