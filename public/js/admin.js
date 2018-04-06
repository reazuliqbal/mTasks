/*eslint-disable */
$(document).ready(function() {
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

    // Dynamic confirmation modal
    let elemOm = document.querySelector('#orderManagement');
    M.Modal.init(elemOm);
    let omModal = M.Modal.getInstance(elemOm);
    omModal.options.onOpenStart = function(e) {
      const btn = omModal._openingTrigger;
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      switch (action) {
        case 'approve':
          $('p#warningOm').text('Your approval is necessary as you are the agent. Please enter agent account\'s private key.');
          $('button#actionBtnOm').toggleClass('green').text('Approve');
        break;

        case 'decline':
          $('p#warningOm').text('If you decline, the order will be deleted, buyer will be refunded.');
          $('button#actionBtnOm').toggleClass('red').text('Decline');
        break;
      }

      $('#orderManagement input[name=action]').val(action);
      $('#orderManagement input[name=orderId]').val(id);
    }
    omModal.options.onCloseStart = function(e) {
      $('p#warningOm').text('');
      $('button#actionBtnOm').removeClass('red').removeClass('green');
      $('#orderManagement input[name=action]').val('');
      $('#orderManagement input[name=orderId]').val('');
      $('#orderManagement input[name=wif]').val('');
    }
});