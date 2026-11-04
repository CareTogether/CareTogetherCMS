import assert from 'node:assert/strict';
import test from 'node:test';
import {
  documentFileExtension,
  documentPreviewKind,
  isPreviewableDocument,
} from './documentPreview.ts';

test('reads the lowercase extension of an uploaded file name', () => {
  assert.equal(documentFileExtension('Intake Form.PDF'), 'pdf');
  assert.equal(documentFileExtension('  photo.final.jpeg  '), 'jpeg');
});

test('has no extension for names without one', () => {
  assert.equal(documentFileExtension(undefined), undefined);
  assert.equal(documentFileExtension(''), undefined);
  assert.equal(documentFileExtension('README'), undefined);
  assert.equal(documentFileExtension('trailing-dot.'), undefined);
});

test('previews PDFs in the PDF viewer', () => {
  assert.equal(documentPreviewKind('background-check.pdf'), 'pdf');
});

test('previews browser-supported images as images', () => {
  for (const fileName of [
    'a.png',
    'b.JPG',
    'c.jpeg',
    'd.gif',
    'e.webp',
    'f.bmp',
    'g.avif',
  ]) {
    assert.equal(documentPreviewKind(fileName), 'image', fileName);
  }
});

test('does not preview other file types', () => {
  for (const fileName of [
    'form.docx',
    'budget.xlsx',
    'notes.txt',
    'scan.heic',
    'scan.tiff',
    'drawing.svg',
    'page.html',
    'archive.zip',
    'constructor',
    'x.constructor',
    undefined,
  ]) {
    assert.equal(isPreviewableDocument(fileName), false, String(fileName));
  }
});
