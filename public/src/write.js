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
}
function setStateFlie() {
    selectImg.className = selectBtn
    selectFile.className = selectBtn + 'selected'
    imgSelectWrap.style.display = 'none'
    fileSelectWrap.style.display = 'flex'
    imgInput.disabled = true
    fileInput.disabled = false
    isImg = false
}

setStateFlie()
selectImg.onclick = () => {
    setStateImg()
}

selectFile.onclick = () => {
    setStateFlie()
}