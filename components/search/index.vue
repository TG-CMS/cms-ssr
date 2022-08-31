<template>
  <div class="searchContainer">
    <div>混合</div>
    该搜索框内容会在所有页面共享
    <input  type="text" class="input" placeholder="该搜索框内容会在所有页面共享" @input="setText">
    <img src="https://img.alicdn.com/tfs/TB15zSoX21TBuNjy0FjXXajyXXa-48-48.png" alt="" class="searchImg" @click="toSearch">
  </div>
</template>

<script lang="ts" setup>
const setText = (e: any) => {

}
const toSearch = () => {
  location.href = `https://search.youku.com/search_video?keyword=`
}
</script>

<style lang="less" scoped>
@import "./index.less";
</style>
