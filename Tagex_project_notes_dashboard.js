/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 * Purpose:
 * Popup page used by Project Dashboard to add/edit draft notes before main dashboard Submit.
 * Also shows existing notes already saved on the Project record.
 */
define(['N/log', 'N/search', 'N/url'], function (log, search, url) {

  var PROJECT_RECORD_TYPE_ID = '2670';

  function esc(s) {
    s = (s == null ? '' : String(s));
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getExistingNotes(projectId) {
    var notes = [];

    if (!projectId) return notes;

    try {
      log.debug('Existing notes search start', { projectId: projectId });

      search.create({
        type: 'customrecord_project',
        filters: [
          ['internalidnumber', 'equalto', projectId]
        ],
        columns: [
          search.createColumn({ name: 'notetype', join: 'userNotes' }),
          search.createColumn({ name: 'title', join: 'userNotes' }),
          search.createColumn({ name: 'note', join: 'userNotes' }),
          search.createColumn({ name: 'internalid', join: 'userNotes' }),
          search.createColumn({ name: 'direction', join: 'userNotes' }),
          search.createColumn({ name: 'notedate', join: 'userNotes' }),
          search.createColumn({ name: 'author', join: 'userNotes' })
        ]
      }).run().each(function (r) {
        var noteId = r.getValue({ name: 'internalid', join: 'userNotes' }) || '';

        if (!noteId) return true;

        notes.push({
          id: noteId,
          title: r.getValue({ name: 'title', join: 'userNotes' }) || '',
          memo: r.getValue({ name: 'note', join: 'userNotes' }) || '',
          type: r.getText({ name: 'notetype', join: 'userNotes' }) || '',
          direction: r.getText({ name: 'direction', join: 'userNotes' }) || '',
          date: r.getValue({ name: 'notedate', join: 'userNotes' }) || '',
          time: '',
          author: r.getText({ name: 'author', join: 'userNotes' }) || '',
          url: '/app/crm/common/note.nl?id=' + encodeURIComponent(noteId)
        });

        return notes.length < 50;
      });

      log.debug('Existing notes search complete', {
        projectId: projectId,
        count: notes.length
      });
    } catch (e) {
      log.error('Existing notes search error', {
        projectId: projectId,
        errorName: e.name,
        errorMessage: e.message,
        errorObj: e
      });
    }

    return notes;
  }

  function buildExistingNotesHtml(notes) {
    var html = '';

    html += '<div class="subtab-bar">';
    html += '<div class="subtab active">Existing Notes</div>';
    html += '</div>';

    html += '<div class="notes-list-wrap">';

    if (!notes || !notes.length) {
      html += '<div class="empty-notes">No existing notes found.</div>';
      html += '</div>';
      return html;
    }

    html += '<table class="notes-table">';
    html += '<thead>';
    html += '<tr>';
    html += '<th style="width:70px;">Edit</th>';
    html += '<th style="width:130px;">Date</th>';
    html += '<th style="width:130px;">Author</th>';
    html += '<th style="width:160px;">Title</th>';
    html += '<th>Memo</th>';
    html += '<th style="width:110px;">Direction</th>';
    html += '<th style="width:110px;">Type</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    for (var i = 0; i < notes.length; i++) {
      var n = notes[i];
      html += '<tr>';
      html += '<td>' + (n.url ? '<a href="' + esc(n.url) + '" target="_blank">Edit</a>' : '') + '</td>';
      html += '<td>' + esc(n.date || '') + (n.time ? ' ' + esc(n.time) : '') + '</td>';
      html += '<td>' + esc(n.author || '') + '</td>';
      html += '<td>' + esc(n.title || '') + '</td>';
      html += '<td>' + esc(n.memo || '') + '</td>';
      html += '<td>' + esc(n.direction || '') + '</td>';
      html += '<td>' + esc(n.type || '') + '</td>';
      html += '</tr>';
    }

    html += '</tbody>';
    html += '</table>';
    html += '</div>';

    return html;
  }

  function onRequest(context) {
    var request = context.request;
    var p = request.parameters || {};
    var projectId = p.projectid || '';
    var mode = p.mode || 'add';
    var existingNotes = getExistingNotes(projectId);

    log.debug('Note Popup Opened', {
      projectId: projectId,
      noteId: p.noteid || '',
      tempId: p.tempid || '',
      existingCount: existingNotes.length,
      mode: mode
    });

    var html = '';

    html += '<!DOCTYPE html>';
    html += '<html>';
    html += '<head>';
    html += '<title>Project Notes</title>';
    html += '<meta charset="UTF-8">';
    html += '<style>';
    html += 'body{font-family:Arial,Helvetica,sans-serif;background:#fff;margin:0;color:#1f2937;font-size:13px;}';
    html += '.page{padding:0;}';
    html += '.header{display:flex;align-items:center;gap:10px;padding:14px 18px 8px 18px;}';
    html += '.icon{width:18px;height:18px;background:#facc15;display:inline-block;border-radius:2px;}';
    html += '.page-title{font-size:22px;font-weight:800;color:#4b5563;}';
    html += '.actions-top{display:flex;align-items:center;gap:8px;padding:6px 18px 14px 18px;border-bottom:1px solid #e5e7eb;}';
    html += '.btn{border:1px solid #c9c9c9;border-radius:3px;padding:7px 14px;font-weight:700;cursor:pointer;background:#e5e7eb;color:#111827;}';
    html += '.btn-save{background:#006aff;color:#fff;border-color:#006aff;}';
    html += '.more-actions{font-weight:700;margin-left:10px;color:#333;}';
    html += '.form-area{display:grid;grid-template-columns:330px 1fr;gap:55px;padding:18px;}';
    html += '.left-form{max-width:330px;}';
    html += '.label{font-size:12px;color:#6b7280;text-transform:uppercase;margin:8px 0 3px 0;}';
    html += 'input,select,textarea{box-sizing:border-box;border:1px solid #bfc5cc;border-radius:0;background:#fff;color:#111827;font-size:13px;}';
    html += 'input,select{height:28px;width:100%;padding:3px 6px;}';
    html += 'textarea{width:100%;height:230px;padding:6px;resize:vertical;}';
    html += '.memo-wrap{max-width:420px;}';
    html += '.required{color:#c2410c;font-weight:900;}';
    html += '.hint{font-size:12px;color:#64748b;margin-top:8px;}';
    html += '.subtab-bar{background:#dfe6ef;border-top:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;padding-left:18px;margin-top:8px;}';
    html += '.subtab{display:inline-block;padding:8px 12px;font-weight:700;color:#1f2937;background:#f8fafc;border-right:1px solid #cbd5e1;}';
    html += '.subtab.active{background:#fff;border-top:3px solid #64748b;padding-top:5px;}';
    html += '.notes-list-wrap{padding:0 18px 18px 18px;}';
    html += '.notes-table{width:100%;border-collapse:collapse;font-size:12px;}';
    html += '.notes-table th{background:#e5e5e5;color:#555;text-transform:uppercase;font-size:11px;font-weight:700;text-align:left;padding:8px;border-bottom:1px solid #d1d5db;}';
    html += '.notes-table td{padding:8px;border-bottom:1px solid #e5e7eb;vertical-align:top;}';
    html += '.notes-table a{color:#2563eb;text-decoration:none;}';
    html += '.empty-notes{padding:14px 0;color:#64748b;font-weight:700;}';
    html += '</style>';
    html += '</head>';
    html += '<body>';

    html += '<div class="page">';
    html += '<div class="header"><span class="icon"></span><span class="page-title">Note</span></div>';
    html += '<div class="actions-top">';
    html += '<button type="button" class="btn btn-save" onclick="saveNote();">Save</button>';
    html += '<button type="button" class="btn" onclick="window.close();">Cancel</button>';
    html += '<span class="more-actions">More Actions</span>';
    html += '</div>';

    if (mode !== 'view') {
    html += '<div class="form-area">';
    html += '<div class="left-form">';

    html += '<div class="label">Title</div>';
    html += '<input type="text" id="note_title" value="' + esc(p.title || '') + '">';

    html += '<div class="label">Type</div>';
    html += '<select id="note_type">';
    html += '<option value=""></option>';
    html += '<option value="2">Conference Call</option>';
    html += '<option value="3" selected>E-mail</option>';
    html += '<option value="4">Fax</option>';
    html += '<option value="5">Letter</option>';
    html += '<option value="6">Meeting</option>';
    html += '<option value="7">Note</option>';
    html += '<option value="8">Phone Call</option>';
    html += '</select>';

    html += '<div class="label">Direction</div>';
    html += '<select id="note_direction">';
    html += '<option value=""></option>';
    html += '<option value="1" selected>Incoming</option>';
    html += '<option value="2">Outgoing</option>';
    html += '</select>';

    html += '<div class="label">Date</div>';
    html += '<input type="text" id="note_date" value="' + esc(new Date().toLocaleDateString()) + '" readonly>';

    html += '<div class="label">Time</div>';
    html += '<input type="text" id="note_time" value="' + esc(new Date().toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})) + '" readonly>';

    html += '</div>';

    html += '<div class="memo-wrap">';
    html += '<div class="label">Memo <span class="required">*</span></div>';
    html += '<textarea id="note_memo">' + esc(p.memo || '') + '</textarea>';
    html += '<div class="hint">This note is added to dashboard first. It is saved to Project only after dashboard Submit.</div>';
    html += '</div>';
    html += '</div>';
    }

    html += buildExistingNotesHtml(existingNotes);

    html += '</div>';

    html += '<script>';
    html += 'function getVal(id){var el=document.getElementById(id);return el?el.value:"";}';
    html += 'function saveNote(){';
    html += '  var obj = {';
    html += '    recId: "' + esc(projectId) + '",';
    html += '    noteId: "' + esc(p.noteid || '') + '",';
    html += '    tempId: "' + esc(p.tempid || '') + '",';
    html += '    title: getVal("note_title"),';
    html += '    notetype: getVal("note_type"),';
    html += '    direction: getVal("note_direction"),';
    html += '    memo: getVal("note_memo")';
    html += '  };';
    html += '  if(!obj.memo){ alert("Memo is required."); return; }';
    html += '  if(window.opener && window.opener.receiveProjectNote){';
    html += '    window.opener.receiveProjectNote(obj);';
    html += '  } else {';
    html += '    alert("Dashboard window was not found. Please keep the dashboard open.");';
    html += '    return;';
    html += '  }';
    html += '  window.close();';
    html += '}';
    html += '</script>';

    html += '</body>';
    html += '</html>';

    context.response.write(html);
  }

  return {
    onRequest: onRequest
  };
});
