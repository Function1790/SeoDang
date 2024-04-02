document.addEventListener('DOMContentLoaded', function () {
    const image = document.getElementById('itemImg');
    image.style.display = 'none'
    document.getElementById('chooseFile').addEventListener('change', function (event) {
        const selectedFile = event.target.files[0];

        if (selectedFile) {
            const reader = new FileReader();

            reader.addEventListener('load', function () {
                image.style.display = 'flex'
                image.src = reader.result;
            });

            reader.readAsDataURL(selectedFile);
        }
    });
});

function getByID(idname) {
    return document.getElementById(idname)
}
function getByClass(classname) {
    return document.getElementsByClassName(classname)
}

const title = getByID('title')
const content = getByID('content')
const select = getByID('select')
const chooseFile = getByID('chooseFile')
const price = getByID('price')

function formatData() {
    return {
        title: title.value,
        content: content.value,
        category: select.value !== "과목 선택" ? select.value : null,
        price: price.value
    }
}

//File
const imgSelectWrap = getByClass('imgSelectWrap')[0]
const fileSelectWrap = getByClass('fileSelectWrap')[0]
const selectImg = getByID('selectImg')
const selectFile = getByID('selectFile')
const imgInput = getByID('chooseFile')
const fileInput = getByID('chooseFile2')
const form = getByID('form')
const selectBtn = 'inputLabel selectBtn '
var isImg = true

function setStateImg() {
    selectImg.className = selectBtn + 'selected'
    selectFile.className = selectBtn
    imgSelectWrap.style.display = 'flex'
    fileSelectWrap.style.display = 'none'
    imgInput.disabled = false
    fileInput.disabled = true
    isImg = true
    form.action = '/write-check'
}

function setStateFlie() {
    selectImg.className = selectBtn
    selectFile.className = selectBtn + 'selected'
    imgSelectWrap.style.display = 'none'
    fileSelectWrap.style.display = 'flex'
    imgInput.disabled = true
    fileInput.disabled = false
    isImg = false
    form.action = '/write-check2'
}

//초기 상태
setStateImg()
selectImg.onclick = () => {
    setStateImg()
}

selectFile.onclick = () => {
    setStateFlie()
}

var fileNo = 0;
var filesArr = new Array();

/* 첨부파일 추가 */
fileInput.onchange = () => {
    var obj = fileInput
    var maxFileCnt = 5;   // 첨부파일 최대 개수
    var attFileCnt = document.querySelectorAll('.filebox').length;    // 기존 추가된 첨부파일 개수
    var remainFileCnt = maxFileCnt - attFileCnt;    // 추가로 첨부가능한 개수
    var curFileCnt = obj.files.length;  // 현재 선택된 첨부파일 개수

    // 첨부파일 개수 확인
    if (curFileCnt > remainFileCnt) {
        alert("첨부파일은 최대 " + maxFileCnt + "개 까지 첨부 가능합니다.");
    }

    for (var i = 0; i < Math.min(curFileCnt, remainFileCnt); i++) {

        const file = obj.files[i];

        // 첨부파일 검증
        if (validation(file)) {
            // 파일 배열에 담기
            var reader = new FileReader();
            reader.onload = function () {
                filesArr.push(file);
            };
            reader.readAsDataURL(file)

            // 목록 추가
            let htmlData = '';
            htmlData += '<div id="file' + fileNo + '" class="filebox">';
            htmlData += '   <a class="delete" onclick="deleteFile(' + fileNo + ');"><i class="far fa-minus-square">x</i></a>';
            htmlData += '   <p class="name">' + file.name + '</p>';
            htmlData += '</div>';
            $('.file-list').append(htmlData);
            fileNo++;
        } else {
            continue;
        }
    }
    // 초기화
    document.querySelector("input[type=file]").value = "";
}

/* 첨부파일 검증 */
function validation(obj) {
    const fileTypes = ['application/pdf', 'image/gif', 'image/jpeg', 'image/png', 'image/bmp', 'image/tif', 'application/haansofthwp', 'application/x-hwp', 'text/plain'];
    if (obj.name.length > 100) {
        alert("파일명이 100자 이상인 파일은 제외되었습니다.");
        return false;
    } else if (obj.size > (150 * 1024 * 1024)) {
        alert("최대 파일 용량인 150MB를 초과한 파일은 제외되었습니다.");
        return false;
    } else if (obj.name.lastIndexOf('.') == -1) {
        alert("확장자가 없는 파일은 제외되었습니다.");
        return false;
    } else if (!fileTypes.includes(obj.type)) {
        alert("첨부가 불가능한 파일은 제외되었습니다.");
        return false;
    } else {
        return true;
    }
}

/* 첨부파일 삭제 */
function deleteFile(num) {
    document.querySelector("#file" + num).remove();
    filesArr[num].is_delete = true;
}