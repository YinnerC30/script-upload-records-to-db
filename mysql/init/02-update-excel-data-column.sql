-- Actualizar el tipo de columna data para soportar archivos Excel grandes
ALTER TABLE excel_data MODIFY COLUMN data LONGTEXT;
