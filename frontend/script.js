"use strict";

const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://127.0.0.1:8000"
  : "https://studymate-ai-class10.onrender.com";

const microphoneButton = document.getElementById("microphone-button");
const microphoneLabel = document.getElementById("microphone-label");
const questionInput = document.getElementById("question-input");
const statusMessage = document.getElementById("status-message");
const submitButton = document.getElementById("submit-button");
const requestStatus = document.getElementById("request-status");
const conversation = document.getElementById("conversation");
const welcomeScreen = document.getElementById("welcome-screen");
const appLayout = document.getElementById("app-layout");
const composerArea = document.getElementById("composer-area");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const newChatButton = document.getElementById("new-chat-button");
const chaptersNav = document.getElementById("chapters-nav");
const quizNav = document.getElementById("quiz-nav");
const recentNav = document.getElementById("recent-nav");
const chapterList = document.getElementById("chapter-list");
const selectedChapterLabel = document.getElementById("selected-chapter");
const chaptersTitle = document.getElementById("chapters-title");
const chaptersDescription = document.getElementById("chapters-description");
const chapterAvailabilityNote = document.getElementById("chapter-availability-note");
const recentChatList = document.getElementById("recent-chat-list");
const historyStatus = document.getElementById("history-status");
const deleteHistoryButton = document.getElementById("delete-history-button");
const chaptersPanel = document.getElementById("chapters-panel");
const quizPanel = document.getElementById("quiz-panel");
const recentPanel = document.getElementById("recent-panel");
const chatViewport = document.getElementById("chat-scroll");
const workspaceViewport = document.getElementById("workspace-viewport");
const subjectSelect = document.getElementById("subject-select");
const sidebarSubjectLabel = document.getElementById("sidebar-subject-label");
const welcomeEyebrow = document.getElementById("welcome-eyebrow");
const welcomeTitle = document.getElementById("welcome-title");
const welcomeCopy = document.getElementById("welcome-copy");
const suggestionHeading = document.getElementById("suggestion-heading");
const suggestionGrid = document.getElementById("suggestion-grid");
const suggestionEmpty = document.getElementById("suggestion-empty");
const sessionStorageKey = "class10-science-tutor-session-id";
const recentChatsStorageKey = "studymate-ai-recent-chats-v1";
const subjects = {
  Science: "Science",
  Maths: "Maths",
  English: "English",
  Social_Science: "Social Science"
};
const subjectStudyData = {
  Science: {
    welcomeTitle: "Learn the logic.<br>Keep the wonder.",
    welcomeCopy:
      "A thoughtful place to work through your Science textbook. Ask a question and follow the explanation back to its source.",
    chaptersTitle: "Science chapters",
    chaptersDescription:
      "These titles are taken from the available Science textbook PDFs. Choosing a chapter marks your study focus only; questions still search the full index.",
    availabilityNote:
      "Chapter 8 is not listed because no matching chapter PDF was found in the current folder.",
    chapters: [
      { number: 1, title: "Chemical Reactions and Equations", pdf: "jesc101.pdf" },
      { number: 2, title: "Acids, Bases and Salts", pdf: "jesc102.pdf", question: "What is the difference between acids and bases?", suggestionOrder: 3 },
      { number: 3, title: "Metals and Non-metals", pdf: "jesc103.pdf" },
      { number: 4, title: "Carbon and its Compounds", pdf: "jesc104.pdf" },
      { number: 5, title: "Life Processes", pdf: "jesc105.pdf", question: "How does the human heart pump blood through the body?", suggestionOrder: 2 },
      { number: 6, title: "Control and Coordination", pdf: "jesc106.pdf" },
      { number: 7, title: "How do Organisms Reproduce?", pdf: "jesc107.pdf" },
      { number: 9, title: "Light – Reflection and Refraction", pdf: "jesc109.pdf", question: "Why does the sky appear blue?", suggestionOrder: 1 },
      { number: 10, title: "The Human Eye and the Colourful World", pdf: "jesc110.pdf" },
      { number: 11, title: "Electricity", pdf: "jesc111.pdf", question: "Explain the process of electricity generation in a generator.", suggestionOrder: 4 },
      { number: 12, title: "Magnetic Effects of Electric Current", pdf: "jesc112.pdf" }
    ]
  },
  Maths: {
    welcomeTitle: "Find the pattern.<br>Make it make sense.",
    welcomeCopy:
      "Work through Class 10 Mathematics step by step, with explanations grounded in the chapters available in your textbook.",
    chaptersTitle: "Maths chapters",
    chaptersDescription:
      "These chapter titles were checked against the supplied Mathematics PDFs. Choosing a chapter marks your study focus only; questions still search the full index.",
    availabilityNote:
      "The supplied Mathematics folder has no PDF for Chapter 11; only chapters with an available PDF are listed.",
    chapters: [
      { number: 1, title: "Real Numbers", pdf: "162152-jemh101.pdf", question: "How does Euclid’s division algorithm help find the HCF of two numbers?" },
      { number: 2, title: "Polynomials", pdf: "162339-jemh102.pdf" },
      { number: 3, title: "Pair of Linear Equations in Two Variables", pdf: "162437-jemh103.pdf", question: "How can a pair of linear equations be solved graphically and algebraically?" },
      { number: 4, title: "Quadratic Equations", pdf: "162537-jemh104.pdf", question: "How do the roots of a quadratic equation relate to its discriminant?" },
      { number: 5, title: "Arithmetic Progressions", pdf: "162559-jemh105.pdf" },
      { number: 6, title: "Triangles", pdf: "164524-jemh106.pdf" },
      { number: 7, title: "Coordinate Geometry", pdf: "164540-jemh107.pdf" },
      { number: 8, title: "Introduction to Trigonometry", pdf: "164642-jemh108.pdf", question: "How are the trigonometric ratios related to one another?" },
      { number: 9, title: "Some Applications of Trigonometry", pdf: "16471-jemh109.pdf" },
      { number: 10, title: "Circles", pdf: "164728-jemh110.pdf" },
      { number: 12, title: "Surface Areas and Volumes", pdf: "164916-jemh112.pdf" },
      { number: 13, title: "Statistics", pdf: "164939-jemh113.pdf" },
      { number: 14, title: "Probability", pdf: "164957-jemh114.pdf" }
    ]
  },
  English: {
    welcomeTitle: "Read closely.<br>Think beyond the page.",
    welcomeCopy:
      "Explore the stories, poems, and play in your supplied English PDFs. Ask about a passage and follow the reading back to its source.",
    chaptersTitle: "English chapters & literature",
    chaptersDescription:
      "Each lesson and literature section below was identified in the supplied English PDFs. The source filename is shown with each chapter.",
    availabilityNote:
      "Only literature sections found in the supplied PDFs are listed.",
    chapters: [
      { number: 1, title: "A Letter to God", pdf: "jeff101.pdf", sections: ["Dust of Snow", "Fire and Ice"], question: "How does Lencho’s faith shape the way he responds to the loss of his crop?" },
      { number: 2, title: "Nelson Mandela: Long Walk to Freedom", pdf: "jeff102.pdf", sections: ["A Tiger in the Zoo"] },
      { number: 3, title: "Two Stories about Flying", pdf: "jeff103.pdf", sections: ["His First Flight", "The Black Aeroplane", "How to Tell Wild Animals", "The Ball Poem"], question: "What helps the young seagull overcome his fear in “His First Flight”?" },
      { number: 4, title: "From the Diary of Anne Frank", pdf: "jeff104.pdf", sections: ["Amanda!"] },
      { number: 5, title: "Glimpses of India", pdf: "jeff105.pdf", sections: ["A Baker from Goa", "Coorg", "Tea from Assam", "The Trees"], question: "What details make the descriptions of Coorg and Assam distinctive?" },
      { number: 6, title: "Mijbil the Otter", pdf: "jeff106.pdf", sections: ["Fog"] },
      { number: 7, title: "Madam Rides the Bus", pdf: "jeff107.pdf", sections: ["The Tale of Custard the Dragon"] },
      { number: 8, title: "The Sermon at Benares", pdf: "jeff108.pdf", sections: ["For Anne Gregory"] },
      { number: 9, title: "The Proposal", pdf: "jeff109.pdf" }
    ]
  },
  Social_Science: {
    welcomeTitle: "Understand the past.<br>Question the present.",
    welcomeCopy:
      "Study the Class 10 Social Science material available in your supplied books. The current collection contains History chapters; answers remain grounded in that textbook context.",
    chaptersTitle: "Social Science chapters",
    chaptersDescription:
      "The supplied Social Science PDFs contain the History textbook. Each chapter below was identified from its PDF.",
    availabilityNote:
      "No Geography, Political Science/Civics, or Economics PDFs were found in the supplied Social Science folder.",
    chapters: [
      { number: 1, title: "Nationalism in Europe", pdf: "jess301.pdf", section: "History", question: "What forces contributed to the rise of nationalism in Europe?" },
      { number: 2, title: "Nationalism in India", pdf: "jess302.pdf", section: "History", question: "How did the Non-Cooperation Movement develop in India?" },
      { number: 3, title: "The Making of a Global World", pdf: "jess303.pdf", section: "History", question: "How did trade and migration connect different parts of the world?" },
      { number: 4, title: "The Age of Industrialisation", pdf: "jess304.pdf", section: "History", question: "How did industrialisation change production and workers’ lives?" },
      { number: 5, title: "Print Culture and the Modern World", pdf: "jess305.pdf", section: "History", question: "How did print culture affect the spread of ideas?" }
    ]
  }
};
let savedChats = [];
let activeChat = null;
let selectedChapterNumber = null;
let selectedChapterSubject = null;
let historyStorageUnavailable = false;
let historySaveFailed = false;

const htmlEntities = {
  amp: "&",
  apos: "'",
  copy: "©",
  gt: ">",
  hellip: "…",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  nbsp: "\u00a0",
  ndash: "–",
  quot: '"',
  rdquo: "”",
  rsquo: "’"
};

function decodeHtmlEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (entity, value) => {
    if (value[0] !== "#") {
      const decoded = htmlEntities[value.toLowerCase()];
      return decoded === undefined ? entity : decoded;
    }

    const isHex = value[1].toLowerCase() === "x";
    const codePoint = Number.parseInt(value.slice(isHex ? 2 : 1), isHex ? 16 : 10);
    if (
      !Number.isInteger(codePoint) ||
      codePoint <= 0 ||
      codePoint > 0x10ffff ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff)
    ) {
      return "\ufffd";
    }
    return String.fromCodePoint(codePoint);
  });
}

function normalizeMarkdown(text) {
  let normalized = String(text)
    .replace(/\r\n?/g, "\n")
    .replace(/\\+r\\+n/g, "\n")
    .replace(/\\+n/g, "\n")
    .replace(/\\+r/g, "\n");

  normalized = normalized
    .replace(/\\+\*\\+\*/g, "**")
    .replace(/\\+_\\+_/g, "__")
    .replace(/\\+\*/g, "*")
    .replace(/\\+_/g, "_")
    .replace(/^([ \t]*)\\+(#{1,6})(?=\s)/gm, "$1$2")
    .replace(/^([ \t]*)\\+([-+])(?=\s)/gm, "$1$2")
    .replace(/^([ \t]*)\\+\*(?=\s)/gm, "$1*")
    .replace(/^([ \t]*)(\d+)\\+\.(?=\s)/gm, "$1$2.")
    .replace(/^([ \t]*)(`{3,})/gm, "$1$2");

  normalized = decodeHtmlEntities(normalized).replace(/\u00a0/g, " ");
  normalized = normalized
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return normalized
    .split("\n")
    .flatMap(splitInlineBlockMarkers)
    .join("\n");
}

function splitInlineBlockMarkers(line) {
  const boundaries = [];
  const markerPattern = /\s+(#{1,6}\s+|\d{1,3}[.)]\s+)/g;
  let match;

  while ((match = markerPattern.exec(line)) !== null) {
    const prefix = line.slice(0, match.index).trimEnd();
    const numberedMarker = match[1].match(/^(\d+)/);
    const isSequentialListMarker =
      numberedMarker &&
      (Number(numberedMarker[1]) === 1 ||
        /(?:^|\s)\d{1,3}[.)]\s+\S/.test(prefix));
    if (
      match.index > 0 &&
      (match[1][0] === "#" ||
        prefix.endsWith(":") ||
        isSequentialListMarker)
    ) {
      boundaries.push(match.index);
    }
  }

  const bulletPattern = /\s+([-*+])\s+(?=\S)/g;
  while ((match = bulletPattern.exec(line)) !== null) {
    const prefix = line.slice(0, match.index).trimEnd();
    const beginsList = /(?:^|\s)(?:\d{1,3}[.)]|[-*+])\s+\S/.test(prefix);
    if (prefix.endsWith(":") || beginsList) {
      boundaries.push(match.index);
    }
  }

  if (boundaries.length === 0) {
    return [line];
  }

  const splitPoints = [...new Set(boundaries)].sort((a, b) => a - b);
  const parts = [];
  let start = 0;
  for (const point of splitPoints) {
    const part = line.slice(start, point).trim();
    if (part) {
      parts.push(part);
    }
    start = point;
  }
  const tail = line.slice(start).trim();
  if (tail) {
    parts.push(tail);
  }
  return parts.length ? parts : [line];
}

function findInlineClosing(text, marker, start) {
  let closingIndex = text.indexOf(marker, start);
  while (closingIndex !== -1) {
    if (text[closingIndex - 1] !== "\\") {
      return closingIndex;
    }
    closingIndex = text.indexOf(marker, closingIndex + marker.length);
  }
  return -1;
}

function appendInlineContent(parent, text, depth = 0) {
  if (depth > 8) {
    parent.appendChild(document.createTextNode(text));
    return;
  }

  let plainStart = 0;
  let index = 0;
  while (index < text.length) {
    let marker = "";
    let tagName = "";
    let markerLength = 0;

    if (text.startsWith("**", index) || text.startsWith("__", index)) {
      marker = text.slice(index, index + 2);
      tagName = "strong";
      markerLength = 2;
    } else if (
      text[index] === "`" ||
      (text[index] === "*" && text[index + 1] !== "*") ||
      (text[index] === "_" &&
        !/[a-z0-9]/i.test(text[index - 1] || "") &&
        text[index + 1] !== "_")
    ) {
      marker = text[index];
      tagName = marker === "`" ? "code" : "em";
      markerLength = 1;
    }

    if (!marker) {
      index += 1;
      continue;
    }

    const closingIndex = findInlineClosing(text, marker, index + markerLength);
    if (closingIndex === -1 || closingIndex === index + markerLength) {
      index += markerLength;
      continue;
    }

    if (plainStart < index) {
      parent.appendChild(document.createTextNode(text.slice(plainStart, index)));
    }

    const element = document.createElement(tagName);
    const contents = text.slice(index + markerLength, closingIndex);
    if (tagName === "code") {
      element.textContent = contents;
    } else {
      appendInlineContent(element, contents, depth + 1);
    }
    parent.appendChild(element);
    index = closingIndex + markerLength;
    plainStart = index;
  }

  if (plainStart < text.length) {
    parent.appendChild(document.createTextNode(text.slice(plainStart)));
  }
}

function isHeadingLine(line) {
  return /^ {0,3}#{1,6}\s+/.test(line);
}

function getListMarker(line) {
  const bullet = line.match(/^(\s*)[-*+]\s+(.+)$/);
  if (bullet) {
    return { type: "ul", content: bullet[2], indent: bullet[1].length };
  }

  const numbered = line.match(/^(\s*)(\d+)[.)]\s+(.+)$/);
  if (numbered) {
    return {
      type: "ol",
      content: numbered[3],
      indent: numbered[1].length,
      start: Number(numbered[2])
    };
  }

  return null;
}

function splitMarkdownTableRow(line) {
  const cells = [];
  let cell = "";
  let codeTicks = 0;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === "`") {
      let tickEnd = index + 1;
      while (line[tickEnd] === "`") {
        tickEnd += 1;
      }
      const tickCount = tickEnd - index;
      if (codeTicks === 0) {
        codeTicks = tickCount;
      } else if (codeTicks === tickCount) {
        codeTicks = 0;
      }
      cell += line.slice(index, tickEnd);
      index = tickEnd - 1;
      continue;
    }

    if (character === "\\" && line[index + 1] === "|") {
      cell += "|";
      index += 1;
      continue;
    }

    if (character === "|" && codeTicks === 0) {
      cells.push(cell.trim());
      cell = "";
      continue;
    }

    cell += character;
  }
  cells.push(cell.trim());

  const trimmed = line.trim();
  if (trimmed.startsWith("|") && cells[0] === "") {
    cells.shift();
  }
  if (trimmed.endsWith("|") && cells[cells.length - 1] === "") {
    cells.pop();
  }

  return line.includes("|") ? cells : null;
}

function getTableCells(line) {
  return splitMarkdownTableRow(line);
}

function isTableSeparator(cells) {
  return (
    cells.length > 1 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell))
  );
}

function getTableAlignment(separatorCell) {
  const startsWithColon = separatorCell.startsWith(":");
  const endsWithColon = separatorCell.endsWith(":");
  if (startsWithColon && endsWithColon) {
    return "center";
  }
  if (endsWithColon) {
    return "right";
  }
  if (startsWithColon) {
    return "left";
  }
  return "";
}

function looksLikeSeparatorRow(cells) {
  return cells.some((cell) => /^:?-+:?$/.test(cell)) &&
    cells.every((cell) => /^[\s:-]*$/.test(cell));
}

function appendMalformedTable(fragment, rows) {
  const fallback = document.createElement("ul");
  fallback.className = "malformed-table-list";
  for (const cells of rows) {
    const item = document.createElement("li");
    const readableCells = cells.filter((cell) => cell.trim() !== "");
    appendInlineContent(item, readableCells.join(" — "));
    fallback.appendChild(item);
  }
  fragment.appendChild(fallback);
}

function appendTable(fragment, headerCells, separatorCells, dataRows) {
  const wrapper = document.createElement("div");
  wrapper.className = "answer-table-wrap";
  wrapper.setAttribute("role", "region");
  wrapper.setAttribute("aria-label", "Scrollable answer table");
  wrapper.tabIndex = 0;
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headerCells.forEach((cellText, index) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.style.textAlign = getTableAlignment(separatorCells[index]);
    appendInlineContent(cell, cellText);
    headerRow.appendChild(cell);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const cells of dataRows) {
    const tableRow = document.createElement("tr");
    headerCells.forEach((unusedHeader, index) => {
      const cell = document.createElement("td");
      cell.style.textAlign = getTableAlignment(separatorCells[index]);
      appendInlineContent(cell, cells[index] || "");
      tableRow.appendChild(cell);
    });
    tbody.appendChild(tableRow);
  }
  table.appendChild(tbody);
  wrapper.appendChild(table);
  fragment.appendChild(wrapper);
}

function isTableContinuation(line) {
  return (
    /^\s{2,}\S/.test(line) ||
    /^\s*(?:page\s+\d+\)?|p(?:age)?\.?\s*\d+\)?|【[^】]+】)\s*$/i.test(line)
  );
}

function isCitationContinuation(cell) {
  return /^\s*(?:page\s+\d+\)?|p(?:age)?\.?\s*\d+\)?|【[^】]+】)\s*$/i.test(
    cell
  );
}

function parseTable(lines, startIndex) {
  const headerCells = getTableCells(lines[startIndex]);
  const separatorCells =
    startIndex + 1 < lines.length
      ? getTableCells(lines[startIndex + 1])
      : null;
  const hasValidSeparator =
    headerCells &&
    separatorCells &&
    headerCells.length === separatorCells.length &&
    isTableSeparator(separatorCells);

  if (hasValidSeparator) {
    const dataRows = [];
    let lineIndex = startIndex + 2;
    const malformedRows = [headerCells];

    while (lineIndex < lines.length && lines[lineIndex].trim()) {
      const rawRow = lines[lineIndex];
      const cells = getTableCells(rawRow);
      if (cells && cells.length === headerCells.length) {
        dataRows.push(cells);
        malformedRows.push(cells);
        lineIndex += 1;
        continue;
      }

      if (
        dataRows.length &&
        cells?.length === 1 &&
        isCitationContinuation(cells[0])
      ) {
        const lastRow = dataRows[dataRows.length - 1];
        lastRow[lastRow.length - 1] = [lastRow[lastRow.length - 1], cells[0]]
          .filter(Boolean)
          .join(" ");
        lineIndex += 1;
        continue;
      }

      if (cells) {
        malformedRows.push(cells);
        lineIndex += 1;
        while (lineIndex < lines.length && getTableCells(lines[lineIndex])) {
          malformedRows.push(getTableCells(lines[lineIndex]));
          lineIndex += 1;
        }
        return {
          type: "malformed",
          rows: malformedRows,
          nextIndex: lineIndex
        };
      }

      if (dataRows.length && isTableContinuation(rawRow)) {
        const continuation = rawRow.trim();
        const lastRow = dataRows[dataRows.length - 1];
        lastRow[lastRow.length - 1] = [lastRow[lastRow.length - 1], continuation]
          .filter(Boolean)
          .join(" ");
        lineIndex += 1;
        continue;
      }
      break;
    }

    return {
      type: "valid",
      headerCells,
      separatorCells,
      dataRows,
      nextIndex: lineIndex
    };
  }

  const candidateRows = [];
  let lineIndex = startIndex;
  while (lineIndex < lines.length && getTableCells(lines[lineIndex])) {
    candidateRows.push(getTableCells(lines[lineIndex]));
    lineIndex += 1;
  }

  if (
    candidateRows.length > 1 &&
    (looksLikeSeparatorRow(candidateRows[1]) ||
      candidateRows.some((cells) => cells.length !== candidateRows[0].length) ||
      candidateRows.every((unusedCells, index) => {
        const row = lines[startIndex + index].trim();
        return row.startsWith("|") && row.endsWith("|");
      }))
  ) {
    return { type: "malformed", rows: candidateRows, nextIndex: lineIndex };
  }
  return null;
}

function appendListBlock(fragment, lines, startIndex) {
  const stack = [];
  let lineIndex = startIndex;

  while (lineIndex < lines.length) {
    const marker = getListMarker(lines[lineIndex]);
    if (!marker) {
      break;
    }

    while (stack.length && marker.indent < stack[stack.length - 1].indent) {
      stack.pop();
    }

    let current = stack[stack.length - 1];
    if (!current) {
      const list = document.createElement(marker.type);
      if (marker.type === "ol" && marker.start !== 1) {
        list.setAttribute("start", String(marker.start));
      }
      fragment.appendChild(list);
      current = {
        indent: marker.indent,
        type: marker.type,
        list,
        lastItem: null
      };
      stack.push(current);
    } else if (marker.indent > current.indent) {
      if (!current.lastItem) {
        break;
      }
      const list = document.createElement(marker.type);
      if (marker.type === "ol" && marker.start !== 1) {
        list.setAttribute("start", String(marker.start));
      }
      current.lastItem.appendChild(list);
      current = {
        indent: marker.indent,
        type: marker.type,
        list,
        lastItem: null
      };
      stack.push(current);
    } else if (
      marker.indent === current.indent &&
      marker.type !== current.type
    ) {
      const parentList = stack.length > 1
        ? stack[stack.length - 2].lastItem
        : fragment;
      const list = document.createElement(marker.type);
      if (marker.type === "ol" && marker.start !== 1) {
        list.setAttribute("start", String(marker.start));
      }
      parentList.appendChild(list);
      current = {
        indent: marker.indent,
        type: marker.type,
        list,
        lastItem: null
      };
      stack[stack.length - 1] = current;
    }

    const item = document.createElement("li");
    appendInlineContent(item, marker.content);
    current.list.appendChild(item);
    current.lastItem = item;
    lineIndex += 1;
  }

  return lineIndex;
}

function renderAnswerMarkdown(markdown) {
  if (window.marked && window.DOMPurify) {
    const renderedMarkdown = window.marked.parse(
      String(markdown).replace(/\r\n?/g, "\n"),
      { async: false, gfm: true }
    );
    const fragment = window.DOMPurify.sanitize(renderedMarkdown, {
      RETURN_DOM_FRAGMENT: true,
      ALLOWED_TAGS: [
        "a", "blockquote", "br", "code", "del", "em", "h1", "h2", "h3", "h4",
        "h5", "h6", "hr", "li", "ol", "p", "pre", "s", "strong", "table",
        "tbody", "td", "th", "thead", "tr", "ul"
      ],
      ALLOWED_ATTR: ["align", "href", "scope", "start", "title"],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|#|\/|\.\.?\/)/i
    });

    fragment.querySelectorAll("table").forEach((table) => {
      const wrapper = document.createElement("div");
      wrapper.className = "answer-table-wrap";
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("aria-label", "Scrollable answer table");
      wrapper.tabIndex = 0;
      table.replaceWith(wrapper);
      wrapper.appendChild(table);
    });

    fragment.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || !/^(?:https?:|mailto:|#|\/|\.\.?\/)/i.test(href)) {
        link.removeAttribute("href");
        return;
      }
      if (/^https?:/i.test(href)) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

    return fragment;
  }

  console.error("Markdown libraries are unavailable; using the safe text-node renderer.");
  return renderLegacyAnswerMarkdown(markdown);
}

function renderLegacyAnswerMarkdown(markdown) {
  const fragment = document.createDocumentFragment();
  const lines = normalizeMarkdown(markdown).split("\n");
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    if (!lines[lineIndex].trim()) {
      lineIndex += 1;
      continue;
    }

    const heading = lines[lineIndex].match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const element = document.createElement(`h${heading[1].length}`);
      appendInlineContent(element, heading[2]);
      fragment.appendChild(element);
      lineIndex += 1;
      continue;
    }

    if (/^\s*```/.test(lines[lineIndex])) {
      lineIndex += 1;
      const codeLines = [];
      while (lineIndex < lines.length && !/^\s*```/.test(lines[lineIndex])) {
        codeLines.push(lines[lineIndex]);
        lineIndex += 1;
      }
      if (lineIndex < lines.length) {
        lineIndex += 1;
      }
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = codeLines.join("\n");
      pre.appendChild(code);
      fragment.appendChild(pre);
      continue;
    }

    if (getListMarker(lines[lineIndex])) {
      lineIndex = appendListBlock(fragment, lines, lineIndex);
      continue;
    }

    const table = getTableCells(lines[lineIndex])
      ? parseTable(lines, lineIndex)
      : null;
    if (table?.type === "valid") {
      appendTable(
        fragment,
        table.headerCells,
        table.separatorCells,
        table.dataRows
      );
      lineIndex = table.nextIndex;
      continue;
    }
    if (table?.type === "malformed") {
      appendMalformedTable(fragment, table.rows);
      lineIndex = table.nextIndex;
      continue;
    }

    const paragraphLines = [];
    while (
      lineIndex < lines.length &&
      lines[lineIndex].trim() &&
      !isHeadingLine(lines[lineIndex]) &&
      !getListMarker(lines[lineIndex]) &&
      !/^\s*```/.test(lines[lineIndex]) &&
      !(getTableCells(lines[lineIndex]) && parseTable(lines, lineIndex))
    ) {
      paragraphLines.push(lines[lineIndex].trim());
      lineIndex += 1;
    }

    const paragraph = document.createElement("p");
    appendInlineContent(paragraph, paragraphLines.join(" "));
    fragment.appendChild(paragraph);
  }

  return fragment;
}

function createSessionId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (value) => value.toString(16).padStart(2, "0")).join("");
}

function getSessionId() {
  try {
    let sessionId = sessionStorage.getItem(sessionStorageKey);
    if (!sessionId) {
      sessionId = createSessionId();
      sessionStorage.setItem(sessionStorageKey, sessionId);
    }
    return sessionId;
  } catch (error) {
    return createSessionId();
  }
}

let selectedSubject = "Science";
let sessionId = getSessionId();
activeChat = {
  session_id: sessionId,
  subject: selectedSubject,
  title: "",
  updated_at: new Date().toISOString(),
  messages: []
};

function getSubjectName(subjectId) {
  return subjects[subjectId] || subjects.Science;
}

function getSubjectStudyData(subjectId = selectedSubject) {
  return subjectStudyData[subjectId] || subjectStudyData.Science;
}

function renderSuggestions(studyData) {
  const suggestedChapters = studyData.chapters
    .filter((chapter) => typeof chapter.question === "string" && chapter.question)
    .sort(
      (left, right) =>
        (left.suggestionOrder || left.number) -
        (right.suggestionOrder || right.number)
    )
    .slice(0, 4);

  suggestionGrid.replaceChildren();
  suggestionHeading.hidden = false;
  suggestionGrid.hidden = false;
  suggestionEmpty.hidden = suggestedChapters.length > 0;

  suggestedChapters.forEach((chapter) => {
    const button = document.createElement("button");
    button.className = "suggestion-card";
    button.type = "button";

    const number = document.createElement("span");
    number.className = "suggestion-number";
    number.setAttribute("aria-hidden", "true");
    number.textContent = String(chapter.number).padStart(2, "0");

    const details = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = chapter.title;
    const question = document.createElement("small");
    question.textContent = chapter.question;
    details.append(title, question);

    const arrow = document.createElement("span");
    arrow.className = "suggestion-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";

    button.append(number, details, arrow);
    button.addEventListener("click", () => {
      questionInput.value = chapter.question;
      questionInput.focus();
      questionInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    suggestionGrid.appendChild(button);
  });
}

function updateSubjectInterface() {
  const studyData = getSubjectStudyData();
  const subjectName = getSubjectName(selectedSubject);
  if (selectedChapterSubject !== selectedSubject) {
    selectedChapterNumber = null;
    selectedChapterSubject = null;
    selectedChapterLabel.textContent =
      "No chapter selected. Chapter selection does not filter tutor retrieval.";
  }
  const classLabel = `Class 10 ${subjectName}`;
  document.title = `StudyMate AI | ${classLabel}`;
  sidebarSubjectLabel.textContent = classLabel;
  welcomeEyebrow.textContent = `CLASS 10 / ${subjectName.toUpperCase()}`;
  document.getElementById("subject-breadcrumb-label").textContent = classLabel;
  questionInput.placeholder = `Ask a question about ${classLabel}...`;
  welcomeTitle.replaceChildren();
  studyData.welcomeTitle.split("<br>").forEach((line, index) => {
    if (index > 0) {
      welcomeTitle.appendChild(document.createElement("br"));
    }
    welcomeTitle.appendChild(document.createTextNode(line));
  });
  welcomeCopy.textContent = studyData.welcomeCopy;
  chaptersNav.hidden = false;
  renderChapters();
  renderSuggestions(studyData);
}

updateSubjectInterface();

function cleanStoredSources(sources) {
  if (!Array.isArray(sources)) {
    return [];
  }

  return sources
    .filter((source) => source && typeof source === "object")
    .map((source) => ({
      pdf_name:
        typeof source.pdf_name === "string" ? source.pdf_name.slice(0, 500) : "",
      page:
        typeof source.page === "string" || typeof source.page === "number"
          ? String(source.page).slice(0, 100)
          : "",
      chapter:
        typeof source.chapter === "string" || typeof source.chapter === "number"
          ? String(source.chapter).slice(0, 200)
          : "",
      subject:
        typeof source.subject === "string" ? source.subject.slice(0, 100) : "",
      source_text:
        typeof source.source_text === "string"
          ? source.source_text.slice(0, 4000)
          : ""
    }))
    .filter(
      (source) =>
        source.pdf_name || source.page || source.chapter || source.source_text
    );
}

function normalizeStoredChat(value) {
  if (
    !value ||
    typeof value !== "object" ||
    typeof value.session_id !== "string" ||
    !value.session_id.trim() ||
    !Array.isArray(value.messages)
  ) {
    return null;
  }

  const messages = value.messages
    .filter(
      (message) =>
        message &&
        typeof message.question === "string" &&
        typeof message.answer === "string"
    )
    .slice(-100)
    .map((message) => ({
      question: message.question.slice(0, 10000),
      answer: message.answer.slice(0, 50000),
      sources: cleanStoredSources(message.sources)
    }));

  if (!messages.length) {
    return null;
  }

  const updatedAt =
    typeof value.updated_at === "string" &&
    Number.isFinite(Date.parse(value.updated_at))
      ? value.updated_at
      : "";

  return {
    session_id: value.session_id.slice(0, 200),
    subject:
      typeof value.subject === "string" && subjects[value.subject]
        ? value.subject
        : "Science",
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title.slice(0, 180)
        : messages[0].question.slice(0, 80),
    updated_at: updatedAt,
    messages
  };
}

function loadSavedChats() {
  try {
    const storedValue = localStorage.getItem(recentChatsStorageKey);
    if (!storedValue) {
      historyStorageUnavailable = false;
      return [];
    }

    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) {
      historyStorageUnavailable = true;
      return [];
    }

    const normalizedChats = parsed
      .map(normalizeStoredChat)
      .filter(Boolean);
    const uniqueChats = new Map();
    normalizedChats.forEach((chat) => {
      if (!uniqueChats.has(chat.session_id)) {
        uniqueChats.set(chat.session_id, chat);
      }
    });
    const validChats = [...uniqueChats.values()]
      .sort((first, second) =>
        (second.updated_at || "").localeCompare(first.updated_at || "")
      );

    if (validChats.length !== parsed.length) {
      historyStorageUnavailable = true;
    } else {
      historyStorageUnavailable = false;
    }
    return validChats.slice(0, 30);
  } catch (error) {
    historyStorageUnavailable = true;
    return [];
  }
}

function saveSuccessfulTurn(question, result) {
  activeChat.messages.push({
    question,
    answer: result.answer,
    sources: cleanStoredSources(result.sources)
  });
  activeChat.messages = activeChat.messages.slice(-100);
  activeChat.subject = selectedSubject;
  activeChat.updated_at = new Date().toISOString();
  if (!activeChat.title) {
    activeChat.title = question.slice(0, 80);
  }

  savedChats = [
    activeChat,
    ...savedChats.filter((chat) => chat.session_id !== activeChat.session_id)
  ].slice(0, 30);

  try {
    localStorage.setItem(recentChatsStorageKey, JSON.stringify(savedChats));
    historyStorageUnavailable = false;
    historySaveFailed = false;
    return true;
  } catch (error) {
    historyStorageUnavailable = true;
    historySaveFailed = true;
    return false;
  }
}

function persistActiveSessionId() {
  try {
    sessionStorage.setItem(sessionStorageKey, sessionId);
  } catch (error) {
    return false;
  }
  return true;
}

function formatChatDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) {
    return "Date unavailable";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

function syncSidebarForViewport() {
  if (window.matchMedia("(max-width: 760px)").matches) {
    appLayout.classList.remove("sidebar-collapsed");
    const isOpen = appLayout.classList.contains("sidebar-open");
    sidebar.inert = !isOpen;
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
    sidebarToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
    return;
  }

  appLayout.classList.remove("sidebar-open");
  const isCollapsed = appLayout.classList.contains("sidebar-collapsed");
  sidebar.inert = isCollapsed;
  sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  sidebarToggle.setAttribute(
    "aria-label",
    isCollapsed ? "Expand navigation" : "Collapse navigation"
  );
}

syncSidebarForViewport();
window.addEventListener("resize", syncSidebarForViewport);

let recognition = null;
let isListening = false;

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.classList.remove("is-error", "is-success");

  if (type) {
    statusMessage.classList.add(`is-${type}`);
  }
}

function setActiveNavigation(activeButton) {
  [chaptersNav, quizNav, recentNav].forEach((button) => {
    button.classList.toggle("is-active", button === activeButton);
    if (button === activeButton) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function showChatView() {
  chatViewport.hidden = false;
  workspaceViewport.hidden = true;
  chaptersPanel.hidden = true;
  quizPanel.hidden = true;
  recentPanel.hidden = true;
  composerArea.hidden = false;
  welcomeScreen.hidden = conversation.children.length > 0;
  conversation.hidden = conversation.children.length === 0;
  setActiveNavigation(null);
}

function showWorkspace(panel, activeButton) {
  chatViewport.hidden = true;
  workspaceViewport.hidden = false;
  welcomeScreen.hidden = true;
  conversation.hidden = true;
  composerArea.hidden = true;
  chaptersPanel.hidden = panel !== chaptersPanel;
  quizPanel.hidden = panel !== quizPanel;
  recentPanel.hidden = panel !== recentPanel;
  setActiveNavigation(activeButton);

  if (panel === recentPanel) {
    renderRecentChats();
  }
  closeMobileSidebar();
}

function renderChapters() {
  const studyData = getSubjectStudyData();
  chapterList.replaceChildren();
  chaptersTitle.textContent = studyData.chaptersTitle;
  chaptersDescription.textContent = studyData.chaptersDescription;
  chapterAvailabilityNote.textContent = studyData.availabilityNote;

  if (!studyData.chapters.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent =
      `No ${getSubjectName(selectedSubject)} chapter list is available because no matching textbook PDFs were found.`;
    chapterList.appendChild(emptyState);
    return;
  }

  studyData.chapters.forEach((chapter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chapter-card";
    button.setAttribute(
      "aria-pressed",
      String(
        selectedChapterSubject === selectedSubject &&
          chapter.number === selectedChapterNumber
      )
    );

    const number = document.createElement("span");
    number.className = "chapter-number";
    number.textContent = String(chapter.number).padStart(2, "0");

    const details = document.createElement("span");
    details.className = "chapter-details";
    const title = document.createElement("strong");
    title.textContent = chapter.title;
    const filename = document.createElement("small");
    filename.textContent = chapter.section
      ? `${chapter.section} · ${chapter.pdf}`
      : chapter.pdf;
    details.append(title, filename);
    if (chapter.sections && chapter.sections.length) {
      const sections = document.createElement("small");
      sections.className = "chapter-section-list";
      sections.textContent = `Also in this PDF: ${chapter.sections.join(" · ")}`;
      details.appendChild(sections);
    }

    const selected = document.createElement("span");
    selected.className = "chapter-selected";
    selected.setAttribute("aria-hidden", "true");
    selected.textContent = "✓";
    button.append(number, details, selected);
    button.addEventListener("click", () => selectChapter(chapter));
    chapterList.appendChild(button);
  });
}

function selectChapter(chapter) {
  selectedChapterNumber = chapter.number;
  selectedChapterSubject = selectedSubject;
  selectedChapterLabel.textContent =
    `Selected: Chapter ${chapter.number} — ${chapter.title} (${chapter.pdf}). ` +
    "This is a study focus only; tutor questions still search the full index.";
  renderChapters();
}

function renderRecentChats() {
  savedChats = loadSavedChats();
  recentChatList.replaceChildren();
  const hasHistoryWarning = historyStorageUnavailable || historySaveFailed;
  historyStatus.textContent = historySaveFailed
    ? "Browser storage could not save the latest conversation. Check available storage and try again."
    : historyStorageUnavailable
      ? "Some saved data was invalid or browser storage is unavailable. Valid conversations are shown when possible."
      : "";
  historyStatus.classList.toggle("is-warning", hasHistoryWarning);

  if (!savedChats.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = hasHistoryWarning
      ? "No valid saved conversations are available."
      : "No saved conversations yet. Successful tutor chats will appear here.";
    recentChatList.appendChild(emptyState);
    return;
  }

  savedChats.forEach((chat) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-chat-card";

    const icon = document.createElement("span");
    icon.className = "recent-chat-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "◷";

    const details = document.createElement("span");
    details.className = "recent-chat-details";
    const title = document.createElement("strong");
    title.textContent = chat.title;
    const metadata = document.createElement("small");
    metadata.textContent =
    `${getSubjectName(chat.subject)} · ${chat.messages.length} ` +
    `${chat.messages.length === 1 ? "question" : "questions"} · ` +
    formatChatDate(chat.updated_at);
    details.append(title, metadata);

    const openIcon = document.createElement("span");
    openIcon.className = "recent-chat-open";
    openIcon.setAttribute("aria-hidden", "true");
    openIcon.textContent = "→";
    button.append(icon, details, openIcon);
    button.addEventListener("click", () => openSavedChat(chat.session_id));
    recentChatList.appendChild(button);
  });
}

function openSavedChat(savedSessionId) {
  const chat = savedChats.find((item) => item.session_id === savedSessionId);
  if (!chat) {
    historyStatus.textContent = "That saved conversation is no longer available.";
    historyStatus.classList.add("is-warning");
    renderRecentChats();
    return;
  }

  const normalizedChat = normalizeStoredChat(chat);
  if (!normalizedChat) {
    historyStatus.textContent = "That saved conversation could not be opened.";
    historyStatus.classList.add("is-warning");
    return;
  }

  sessionId = normalizedChat.session_id;
  selectedSubject = normalizedChat.subject;
  subjectSelect.value = selectedSubject;
  updateSubjectInterface();
  persistActiveSessionId();
  activeChat = normalizedChat;
  conversation.replaceChildren();
  normalizedChat.messages.forEach((message) => {
    addUserMessage(message.question);
    addAssistantMessage({
      answer: message.answer,
      sources: message.sources
    });
  });
  showChatView();
  requestStatus.textContent =
    "Reopened saved chat. Its conversation history will be sent with follow-up questions.";
  requestStatus.classList.remove("is-error", "is-warning");
  requestStatus.classList.add("is-success");
  closeMobileSidebar();
  scrollMessageIntoView(conversation.lastElementChild);
}

function setListening(listening) {
  isListening = listening;
  microphoneButton.classList.toggle("is-listening", listening);
  microphoneButton.setAttribute("aria-pressed", String(listening));
  microphoneButton.setAttribute(
    "aria-label",
    listening ? "Listening" : "Start Speaking"
  );
  microphoneLabel.textContent = listening ? "Listening..." : "Start Speaking";
  microphoneButton.disabled = listening || !SpeechRecognition;
}

function handleRecognitionError(error) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    setStatus(
      "Microphone permission denied. Allow microphone access in your browser settings, or type your question.",
      "error"
    );
  } else if (error === "audio-capture") {
    setStatus(
      "No microphone was found. Check your microphone connection, or type your question.",
      "error"
    );
  } else if (error === "no-speech") {
    setStatus("No speech was detected. Try again or type your question.", "error");
  } else if (error === "aborted") {
    setStatus("Speech recognition was stopped. You can try again or type your question.");
  } else {
    setStatus(
      "Recognition error. Check your connection and microphone, or type your question.",
      "error"
    );
  }
}

if (!SpeechRecognition) {
  setStatus(
    "Speech recognition not supported in this browser. You can type your question below.",
    "error"
  );
  microphoneButton.disabled = true;
  microphoneButton.title = "Speech recognition is not supported in this browser.";
} else {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.addEventListener("start", () => {
    setListening(true);
    setStatus("Listening...");
  });

  recognition.addEventListener("result", (event) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .map((result) => result[0].transcript)
      .join(" ")
      .trim();

    if (transcript) {
      questionInput.value = transcript;
      setStatus("Speech converted to text. Review or edit your question.", "success");
    } else {
      setStatus("No speech was detected. Try again or type your question.", "error");
    }
  });

  recognition.addEventListener("error", (event) => {
    handleRecognitionError(event.error);
  });

  recognition.addEventListener("end", () => {
    setListening(false);
    if (statusMessage.textContent === "Listening...") {
      setStatus("Ready to record");
    }
  });

  microphoneButton.addEventListener("click", () => {
    if (isListening || !recognition) {
      return;
    }

    try {
      setStatus("Starting microphone...");
      recognition.start();
    } catch (error) {
      if (error instanceof DOMException && error.name === "InvalidStateError") {
        setStatus("Recognition is already active. Please wait and try again.", "error");
        return;
      }
      setStatus(
        "Unable to start speech recognition. Check microphone access or type your question.",
        "error"
      );
    }
  });
}

submitButton.addEventListener("click", () => {
  submitQuestion();
});

function scrollMessageIntoView(message) {
  const viewportBounds = chatViewport.getBoundingClientRect();
  const messageBounds = message.getBoundingClientRect();
  const edgePadding = 16;
  let scrollDelta = 0;

  if (messageBounds.bottom > viewportBounds.bottom - edgePadding) {
    scrollDelta = messageBounds.bottom - (viewportBounds.bottom - edgePadding);
  } else if (messageBounds.top < viewportBounds.top + edgePadding) {
    scrollDelta = messageBounds.top - (viewportBounds.top + edgePadding);
  }

  chatViewport.scrollBy({
    top: scrollDelta,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth"
  });
}

function createMessage(role, label) {
  const message = document.createElement("article");
  message.className = `message ${role}-message`;

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = role === "user" ? "You" : "S";

  const body = document.createElement("div");
  body.className = "message-body";

  const heading = document.createElement("div");
  heading.className = "message-heading";

  const name = document.createElement("strong");
  name.textContent = label;
  heading.appendChild(name);

  const time = document.createElement("time");
  time.dateTime = new Date().toISOString();
  time.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
  heading.appendChild(time);

  body.appendChild(heading);
  message.append(avatar, body);
  conversation.appendChild(message);
  return { message, body };
}

function addUserMessage(question) {
  const { body } = createMessage("user", "You");
  const text = document.createElement("p");
  text.className = "user-text";
  text.textContent = question;
  body.appendChild(text);
}

function addLoadingMessage() {
  const { message, body } = createMessage("assistant", "StudyMate AI");
  message.classList.add("loading-message");

  const loading = document.createElement("div");
  loading.className = "loading-indicator";
  loading.setAttribute("aria-label", "Tutor is thinking");
  for (let index = 0; index < 3; index += 1) {
    loading.appendChild(document.createElement("span"));
  }
  body.appendChild(loading);

  const label = document.createElement("span");
  label.className = "loading-label";
  label.textContent = "Working through your question...";
  body.appendChild(label);
  return message;
}

function addAssistantMessage(result) {
  const { body } = createMessage("assistant", "StudyMate AI");
  const formattedAnswer = document.createElement("div");
  formattedAnswer.className = "answer-text";
  formattedAnswer.appendChild(renderAnswerMarkdown(result.answer));
  body.appendChild(formattedAnswer);

  const uniqueSources = [];
  const seenSources = new Set();
  for (const source of result.sources) {
    if (!source || typeof source !== "object") {
      continue;
    }

    const pdfName =
      typeof source.pdf_name === "string" ? source.pdf_name.trim() : "";
    const page =
      typeof source.page === "string" || typeof source.page === "number"
        ? String(source.page).trim()
        : "";
    const sourceText =
      typeof source.source_text === "string" ? source.source_text.trim() : "";
    const chapter =
      typeof source.chapter === "string" || typeof source.chapter === "number"
        ? String(source.chapter).trim()
        : "";
    if (!pdfName && !page && !chapter && !sourceText) {
      continue;
    }
    const sourceKey = JSON.stringify([pdfName, page, sourceText]);
    if (!seenSources.has(sourceKey)) {
      seenSources.add(sourceKey);
      uniqueSources.push({ pdfName, page, chapter, sourceText });
    }
  }

  if (uniqueSources.length > 0) {
    const sourcesDetails = document.createElement("details");
    sourcesDetails.className = "sources-details";

    const summary = document.createElement("summary");
    summary.textContent = `Textbook sources (${uniqueSources.length})`;
    sourcesDetails.appendChild(summary);

    const sourcesList = document.createElement("ul");
    sourcesList.className = "sources-list";
    for (const source of uniqueSources) {
      const listItem = document.createElement("li");
      const citation = document.createElement("span");
      const citationParts = [
        source.pdfName,
        source.page ? `Page ${source.page}` : "",
        source.chapter ? `Chapter ${source.chapter}` : ""
      ].filter(Boolean);
      if (citationParts.length) {
        citation.textContent = citationParts.join(" · ");
        listItem.appendChild(citation);
      }
      if (source.sourceText) {
        const sourceDetails = document.createElement("details");
        sourceDetails.className = "source-text-details";
        const sourceSummary = document.createElement("summary");
        sourceSummary.textContent = "Source text";
        const sourceText = document.createElement("p");
        sourceText.textContent = source.sourceText;
        sourceDetails.append(sourceSummary, sourceText);
        listItem.appendChild(sourceDetails);
      }
      sourcesList.appendChild(listItem);
    }
    sourcesDetails.appendChild(sourcesList);
    body.appendChild(sourcesDetails);
  }

  const tools = document.createElement("div");
  tools.className = "message-tools";
  const copyButton = document.createElement("button");
  copyButton.className = "tool-button";
  copyButton.type = "button";
  copyButton.textContent = "Copy answer";
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(formattedAnswer.innerText);
      copyButton.textContent = "Copied";
    } catch (error) {
      requestStatus.textContent = "Could not copy the answer. Select and copy it manually.";
      requestStatus.classList.remove("is-success", "is-warning");
      requestStatus.classList.add("is-error");
    }
  });
  tools.appendChild(copyButton);
  body.appendChild(tools);
}

function startNewChat() {
  sessionId = createSessionId();
  persistActiveSessionId();
  activeChat = {
    session_id: sessionId,
    subject: selectedSubject,
    title: "",
    updated_at: new Date().toISOString(),
    messages: []
  };

  conversation.replaceChildren();
  chatViewport.scrollTop = 0;
  showChatView();
  questionInput.value = "";
  questionInput.style.height = "";
  requestStatus.textContent = "";
  requestStatus.classList.remove("is-error", "is-success", "is-warning");
  setStatus("Ready to record");
  closeMobileSidebar();
}

function closeMobileSidebar() {
  appLayout.classList.remove("sidebar-open");
  if (window.matchMedia("(max-width: 760px)").matches) {
    sidebar.inert = true;
    sidebarToggle.setAttribute("aria-expanded", "false");
    sidebarToggle.setAttribute("aria-label", "Open navigation");
  } else {
    const isExpanded = !appLayout.classList.contains("sidebar-collapsed");
    sidebar.inert = !isExpanded;
    sidebarToggle.setAttribute("aria-expanded", String(isExpanded));
    sidebarToggle.setAttribute(
      "aria-label",
      isExpanded ? "Collapse navigation" : "Expand navigation"
    );
  }
}

function deleteRecentHistory() {
  if (!window.confirm("Delete all saved conversations from this browser?")) {
    return;
  }

  try {
    localStorage.removeItem(recentChatsStorageKey);
    savedChats = [];
    historyStorageUnavailable = false;
    historySaveFailed = false;
    startNewChat();
    showWorkspace(recentPanel, recentNav);
    historyStatus.textContent = "Saved conversation history was deleted.";
    historyStatus.classList.remove("is-warning");
  } catch (error) {
    historyStatus.textContent = "Browser storage could not delete the saved history.";
    historyStatus.classList.add("is-warning");
  }
}

chaptersNav.addEventListener("click", () => {
  showWorkspace(chaptersPanel, chaptersNav);
});

quizNav.addEventListener("click", () => {
  showWorkspace(quizPanel, quizNav);
});

recentNav.addEventListener("click", () => {
  showWorkspace(recentPanel, recentNav);
});

document.querySelectorAll("[data-return-chat]").forEach((button) => {
  button.addEventListener("click", showChatView);
});

deleteHistoryButton.addEventListener("click", deleteRecentHistory);

renderChapters();
newChatButton.addEventListener("click", startNewChat);

sidebarToggle.addEventListener("click", () => {
  if (window.matchMedia("(max-width: 760px)").matches) {
    const isOpen = appLayout.classList.toggle("sidebar-open");
    sidebar.inert = !isOpen;
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
    sidebarToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
    return;
  }

  const isCollapsed = appLayout.classList.toggle("sidebar-collapsed");
  sidebar.inert = isCollapsed;
  sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  sidebarToggle.setAttribute(
    "aria-label",
    isCollapsed ? "Expand navigation" : "Collapse navigation"
  );
});

sidebarBackdrop.addEventListener("click", closeMobileSidebar);

subjectSelect.addEventListener("change", () => {
  if (!subjects[subjectSelect.value]) {
    subjectSelect.value = selectedSubject;
    return;
  }

  if (subjectSelect.value === selectedSubject) {
    return;
  }

  selectedSubject = subjectSelect.value;
  updateSubjectInterface();
  startNewChat();
});

questionInput.addEventListener("input", () => {
  questionInput.style.height = "auto";
  questionInput.style.height = `${Math.min(questionInput.scrollHeight, 150)}px`;
});

questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitQuestion();
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    startNewChat();
  } else if (event.key === "Escape") {
    closeMobileSidebar();
  }
});

async function submitQuestion() {
  const question = questionInput.value.trim();

  if (!question) {
    setStatus("Please enter or speak a question before submitting.", "error");
    questionInput.focus();
    return;
  }

  showChatView();
  welcomeScreen.hidden = true;
  conversation.hidden = false;
  submitButton.disabled = true;
  subjectSelect.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitButton.setAttribute("aria-label", "Sending question");
  requestStatus.textContent = "Waiting for the tutor...";
  requestStatus.classList.remove("is-error", "is-success", "is-warning");
  addUserMessage(question);
  const loadingMessage = addLoadingMessage();
  scrollMessageIntoView(loadingMessage);
  const chatHistory = activeChat.messages
    .flatMap((message) => [
      { role: "user", content: message.question },
      { role: "assistant", content: message.answer }
    ])
    .slice(-6);

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        subject: selectedSubject,
        chat_history: chatHistory,
        session_id: sessionId
      })
    });

    let result;
    try {
      result = await response.json();
    } catch (error) {
      throw new Error("The tutor returned an invalid response.");
    }
    if (!response.ok) {
      const detail = typeof result.detail === "string" ? result.detail : "";
      throw new Error(detail || "The tutor could not process your question.");
    }

    if (typeof result.answer !== "string" || !Array.isArray(result.sources)) {
      throw new Error("The tutor returned an unexpected response.");
    }

    const historySaved = saveSuccessfulTurn(question, result);
    loadingMessage.remove();
    addAssistantMessage(result);
    questionInput.value = "";
    questionInput.style.height = "";
    requestStatus.textContent = historySaved
      ? "Answer received."
      : "Answer received, but browser storage could not save this conversation.";
    requestStatus.classList.add(historySaved ? "is-success" : "is-warning");
    scrollMessageIntoView(conversation.lastElementChild);
  } catch (error) {
    loadingMessage.remove();
    requestStatus.textContent =
      error instanceof TypeError
        ? "Could not connect to the tutor. Make sure the FastAPI server is running."
        : error.message;
    requestStatus.classList.add("is-error");
  } finally {
    submitButton.disabled = false;
    subjectSelect.disabled = false;
    submitButton.setAttribute("aria-label", "Send question");
    submitButton.removeAttribute("aria-busy");
  }
}