'use client'
import { useState, useRef, DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, CheckCircle, XCircle, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import * as XLSX from 'xlsx'

interface ParsedData {
  fileName: string
  sheets: Record<string, string[][]>
  activeSheet: string
  rowCount: number
}

interface ImportResult {
  success: number
  errors: string[]
}

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ]
  const ALLOWED_EXTENSIONS = /\.(xlsx|xls)$/i

  const parseFile = (file: File) => {
    if (!ALLOWED_EXTENSIONS.test(file.name) && !ALLOWED_TYPES.includes(file.type)) {
      setResult({ success: 0, errors: ['Invalid file type. Only .xlsx and .xls files are accepted.'] })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setResult({ success: 0, errors: [`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 10MB.`] })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheets: Record<string, string[][]> = {}
      workbook.SheetNames.forEach((name) => {
        const ws = workbook.Sheets[name]
        sheets[name] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][]
      })
      const firstSheet = workbook.SheetNames[0]
      const rowCount = (sheets[firstSheet]?.length ?? 1) - 1
      setParsed({ fileName: file.name, sheets, activeSheet: firstSheet, rowCount })
      setResult(null)
    }
    reader.readAsBinaryString(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const handleImport = async () => {
    if (!parsed) return
    setImporting(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90))
    }, 150)

    try {
      const payload: Record<string, unknown[]> = {}
      Object.entries(parsed.sheets).forEach(([name, rows]) => {
        const [headers, ...dataRows] = rows
        if (!headers) return
        payload[name.toLowerCase()] = dataRows.map((row) =>
          Object.fromEntries(headers.map((h, i) => [h, row[i]]))
        )
      })

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      clearInterval(interval)
      setProgress(100)
      setResult({
        success: (data.inserted_agencies ?? 0) + (data.inserted_agents ?? 0),
        errors: data.errors ?? (data.error ? [data.error] : []),
      })
    } catch (e) {
      clearInterval(interval)
      setResult({ success: 0, errors: [e instanceof Error ? e.message : 'Upload failed'] })
    } finally {
      setImporting(false)
    }
  }

  const activeRows = parsed ? parsed.sheets[parsed.activeSheet] ?? [] : []
  const headers = activeRows[0] ?? []
  const previewRows = activeRows.slice(1, 21)

  return (
    <div>
      <div className="px-6 pt-8 pb-5 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-[#161616] dark:text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Data Import
        </motion.h1>
        <p className="text-[#8F9BA8] dark:text-slate-400 mt-1 text-sm">Upload Excel files to import agencies and agents</p>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Step indicators */}
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-3 py-1 rounded-full font-medium ${!parsed && !importing ? 'bg-[#0770E3] text-white' : 'bg-[#F3F4F6] dark:bg-slate-800 text-[#8F9BA8] dark:text-slate-400'}`}>Step 1: Upload</span>
          <span className="text-[#8F9BA8] dark:text-slate-400">→</span>
          <span className={`px-3 py-1 rounded-full font-medium ${parsed && !importing ? 'bg-[#0770E3] text-white' : 'bg-[#F3F4F6] dark:bg-slate-800 text-[#8F9BA8] dark:text-slate-400'}`}>Step 2: Preview</span>
          <span className="text-[#8F9BA8] dark:text-slate-400">→</span>
          <span className={`px-3 py-1 rounded-full font-medium ${importing ? 'bg-[#0770E3] text-white' : 'bg-[#F3F4F6] dark:bg-slate-800 text-[#8F9BA8] dark:text-slate-400'}`}>Step 3: Import</span>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#0770E3] bg-[#F0F7FF] dark:bg-slate-700'
              : 'border-[#0770E3] dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-[#F0F7FF] dark:hover:bg-slate-700'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-[#0770E3]' : 'text-[#0770E3]'}`} />
          <p className="font-semibold mb-1 dark:text-slate-300">
            {isDragging ? 'Drop your file here' : 'Drag & drop your Excel file'}
          </p>
          <p className="text-sm text-muted-foreground">or click to browse — .xlsx, .xls supported</p>
        </div>

        {/* File Info */}
        <AnimatePresence>
          {parsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardContent className="pt-4 flex items-center gap-4">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{parsed.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {parsed.rowCount} data rows · {Object.keys(parsed.sheets).length} sheet(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {Object.keys(parsed.sheets).map((name) => (
                      <button
                        key={name}
                        onClick={() => setParsed({ ...parsed, activeSheet: name })}
                        className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                          parsed.activeSheet === name
                            ? 'bg-[#0770E3] text-white border-[#0770E3]'
                            : 'border-[#E5E7EB] hover:border-[#0770E3]'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preview Table */}
              {headers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Preview — {parsed.activeSheet}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-auto max-h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {headers.map((h, i) => (
                              <TableHead key={i} className="text-xs whitespace-nowrap">{String(h)}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewRows.map((row, ri) => (
                            <TableRow key={ri}>
                              {headers.map((_, ci) => (
                                <TableCell key={ci} className="text-xs whitespace-nowrap">
                                  {String(row[ci] ?? '')}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress + Import */}
              {importing && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#0770E3]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={importing || !parsed}
                className="w-full bg-[#0770E3] hover:bg-[#0558b0] text-white font-semibold rounded-lg transition-colors"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <Card className={result.errors.length === 0 ? 'border-emerald-200' : 'border-yellow-200'}>
                <CardContent className="pt-4 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{result.success} records imported successfully</p>
                  </div>
                </CardContent>
              </Card>

              {result.errors.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      {result.errors.length} error(s)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {result.errors.map((err, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-400">• {err}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
