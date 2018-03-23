$(document).ready(function(){
    $('select').formSelect();
    $(".dropdown-trigger").dropdown();
    $('.sidenav').sidenav();
    $('.chips-placeholder').chips({
        placeholder: 'Enter a tag',
        secondaryPlaceholder: '+Tag',
        limit: 4
    });
    $('.modal').modal();
    $('.tooltipped').tooltip();
});