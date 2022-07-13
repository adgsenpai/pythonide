ace.require("ace/ext/language_tools");
ace.require("ace/keybindings/vscode");

var editor = ace.edit("editor");
editor.setKeyboardHandler("ace/keybindings/vscode");
ace.require("ace/ext/settings_menu").init(editor);
var editor_cnt = 1,
  editor_index = 1,
  active_editor = 1,
  editor_session = [];
var request, init_ts, open_file_name;
var lang = "python3";
default_content =
  "\
# ADGSTUDIOS - Online Python IDE, Editor, Compiler, Interpreter \n\
\n\
print('Hello World from Ashlin Darius Govindasamy')\n\
";
var prev_result = "in";

var isMobile = window.orientation > -1;

toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: true,
  positionClass: "toast-top-right",
  preventDuplicates: true,
  preventOpenDuplicates: true,
  maxOpened: 1,
  onclick: null,
  showDuration: "100",
  hideDuration: "1000",
  timeOut: "3000",
  extendedTimeOut: "1000",
  showEasing: "swing",
  hideEasing: "linear",
  // "showMethod": "show",
  // "hideMethod": "hide"
};

var instance = Split(["#mi", "#d"], {
  direction: "vertical",
  sizes: [66, 28],
  gutterSize: 5,
  cursor: "row-resize",
  minSize: [0, 180],
  onDrag: function () {
    editor.resize();
  },
});

function term_expand() {
  var element = document.getElementById("term-expand").innerHTML;
  if (element === '<i class="fas fa-expand-alt fa-lg"></i>') {
    instance.setSizes([0, 94]);
    editor.resize();
    document.getElementById("term-expand").innerHTML =
      '<i class="fas fa-compress-alt fa-lg"></i>';
  } else {
    instance.setSizes([66, 28]);
    editor.resize();
    document.getElementById("term-expand").innerHTML =
      '<i class="fas fa-expand-alt fa-lg"></i>';
  }
  $("#term-expand").blur();
  $('[data-toggle="tooltip"]').tooltip("hide");
}

editor.setOptions({
  enableBasicAutocompletion: true, // the editor completes the statement when you hit Ctrl + Space
  enableLiveAutocompletion: true, // the editor completes the statement while you are typing
  enableSnippets: true,
  showPrintMargin: false, // hides the vertical limiting strip
  fixedWidthGutter: true,
  autoScrollEditorIntoView: true,
  copyWithEmptySelection: true,
  highlightActiveLine: false,
});

editor.container.style.lineHeight = 1.5;

editor_session[0] = ace.createEditSession(default_content, "ace/mode/python");
editor.setSession(editor_session[0]);
var active_editor_id = $("#editor-1").children("a");
var active_file_name = "main.py";
var repl_host = get_host();
var command_list = [];
var command_index = 0;
var cur_cmd;
var hint_glow;

var y = document.getElementById("editor_footer");
var output = document.getElementById("output");
var exec_detail = document.getElementById("output-status");
var progress_status = document.getElementById("progress-status");

$(function () {
  $('[data-toggle="tooltip"]').tooltip({
    delay: { show: 750, hide: 50 },
  });
});

$(function () {
  $('[data-toggle="popover"]').popover({
    delay: { show: 0, hide: 0 },
  });
});

$(".popover-dismiss").popover({
  trigger: "hover",
});

$(".nav-tabs")
  .on("click", "a", function (e) {
    // e.stopPropagation();
    e.preventDefault();
    detail_chk = e.detail === undefined ? 1 : e.detail;
    if (
      !$(this).hasClass("add-editor") &&
      !$(this).children("input").hasClass("thVal") &&
      detail_chk == 1
    ) {
      active_editor = parseInt($(this).parent().attr("id").split("-")[1]);
      active_editor_id = $(this);

      editor.setSession(editor_session[active_editor - 1]);
      active_file_name = $(this).html();
      $(this).tab("show");
      editor.focus();
      update_editor_footer();
      undo_redo_update();
    }
  })
  .on("click", "span", function () {
    close_tab = $(this).parent();
    close_tab.children("a").click();
    $("#close_file_title").text("Close - " + active_file_name);
    if (editor.getValue() === "") {
      close_editor_tab();
    } else {
      $("#closeEditorTab").modal("show");
    }
  });

$("#redo-editor").attr("disabled", "disabled");
$("#undo-editor").attr("disabled", "disabled");

$("#rename_file").click(function (e) {
  e.stopPropagation();
  e.preventDefault();
  active_editor_id.dblclick();
});

$("#undo-editor").click(function (e) {
  editor.session.getUndoManager().undo();
  undo_redo_update();
});

$("#redo-editor").click(function (e) {
  editor.session.getUndoManager().redo();
  undo_redo_update();
});

editor.getSession().on("change", function () {
  undo_redo_update();
});

let theme =
  localStorage.getItem("theme") !== undefined
    ? localStorage.getItem("theme")
    : "light";

if (theme === "dark") {
  $("body").addClass("dark");
  document.getElementById("toggle-theme").innerHTML =
    '<i class="fas fa-sun fa-lg"></i>';
  editor.setTheme("ace/theme/tomorrow_night_bright");
}

$("#toggle-theme").click(function (e) {
  document.body.classList.toggle("dark");
  if ($("body").hasClass("dark")) {
    editor.setTheme("ace/theme/tomorrow_night_bright");
    document.getElementById("toggle-theme").innerHTML =
      '<i class="fas fa-sun fa-lg"></i>';
    localStorage.setItem("theme", "dark");
  } else {
    editor.setTheme("ace/theme/textmate");
    document.getElementById("toggle-theme").innerHTML =
      '<i class="fas fa-moon fa-lg"></i>';
    localStorage.setItem("theme", "light");
  }
  $("#toggle-theme").blur();
  $('[data-toggle="tooltip"]').tooltip("hide");
});

$(".add-editor").click(function (e) {
  e.stopPropagation();
  e.preventDefault();
  editor_cnt += 1;
  editor_index += 1;
  var id = editor_cnt;

  active_editor = id;
  editor_session[active_editor - 1] = ace.createEditSession(
    "",
    "ace/mode/python"
  );
  editor.setSession(editor_session[active_editor - 1]);

  $(this)
    .closest("li")
    .before(
      '<li id="editor-' +
        id +
        '"><a data-toggle="tab">Untitled' +
        id +
        '.py</a> <span> <i class="fa fa-times"></i></span></li>'
    );
  // $('.nav-tabs li:nth-child(' + id + ') a').click();

  active_editor_id = $(".nav-tabs li").children("a").last();
  active_editor_id.tab("show");
  active_editor_id.dblclick();
  update_editor_footer();
  undo_redo_update();

  editor.selection.on("changeCursor", function (e) {
    update_editor_footer();
  });

  editor.selection.on("changeSelection", function (e) {
    update_editor_footer();
  });

  editor.getSession().on("change", function () {
    undo_redo_update();
  });
});

$(document).on("dblclick", ".nav-tabs > li > a", function (event) {
  if ($(event.target).attr("class") != "thVal") {
    event.stopPropagation();
    event.preventDefault();
    var currentEle = $(this);
    var value = $(this).html();
    if (value.search("<input") === -1) updateVal(currentEle, value);
  }
});

editor.focus();
editor.navigateFileEnd();

update_editor_footer();

editor.selection.on("changeCursor", function (e) {
  update_editor_footer();
});

editor.selection.on("changeSelection", function (e) {
  update_editor_footer();
});

$(".status button").attr("disabled", "disabled");
$("#stop-btn").attr("disabled", "disabled");

socket_options = {
  transports: ["websocket"],
  timeout: 3000,
  "connect timeout": 3000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
};

socket_options["query"] = { type: "shell" };

$(document)
  .keyup(function (e) {
    IsCtrl = false;
    IsShift = false;
  })
  .keydown(function (e) {
    // first capture Ctrl
    if (e.which == 17) {
      IsCtrl = true;
    }

    // now capture Shift
    if (e.which == 16) {
      IsShift = true;
    }

    switch (e.which) {
      case 119:
        run_python();
        e.preventDefault();
        break;

      case 121:
        save_code_modal();
        e.preventDefault();
        break;
    }
  });

$("#output").on("click", function () {
  $("#term-input").focus();
});

window.onbeforeunload = goodbye;
