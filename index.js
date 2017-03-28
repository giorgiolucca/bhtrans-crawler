var jsdom = require('jsdom'),
    request = require('request'),
    sprintf = require('sprintf-js').sprintf,
    first = require('array-first'),
    util = require("util"),
    Table = require('cli-table'),
    itineraryBaseUrl = 'http://servicosbhtrans.pbh.gov.br/bhtrans/e-servicos/S02F02-itinerarioResultado.asp?linha=%s&sublinha=PRINCIPAL',
    args = process.argv.slice(2)
;

try {
    if (args.length === 0) {
        throw 'Bus line should be informed!';
    }
    var busLine = first(args),
        url = sprintf(itineraryBaseUrl, busLine)
    ;
    request({
        uri: url,
        callback: function(error, response, body) {
            if (body.indexOf('LINHA INEXISTENTE') !== -1) {
                console.log("\nBus line nonexistent!\n");
                return;
            }
            jsdom.env({
                html: body,
                scripts: [
                    'http://code.jquery.com/jquery-1.6.min.js'
                ],
                done: function (err, window) {
                    var $ = window.jQuery,
                        $blocks = $('div[data-role="collapsible-set"]'),
                        $busLines = $blocks.find('table')
                    ;
                    $busLines.each(function(i) {
                        var $busLineBlock = $(this).find('tbody tr:gt(0)'),
                            title = $('#bloco2 h3').eq(i).text().replace(/\t/g, '').replace(/\n/g, '').trim(),
                            tableTitle = new Table({
                                chars: {
                                    'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗',
                                    'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝',
                                    'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼',
                                    'right': '║' , 'right-mid': '╢' , 'middle': '│'
                                },
                                head: [
                                    'Linha'
                                ]
                            }),
                            tableContent = new Table({
                                head: [
                                    'Logradouro',
                                    'Ponto em frente ao número'
                                ]
                            })
                        ;

                        $busLineBlock.each(function() {
                            var $column = $(this).find('td'),
                                street = $column.first().text(),
                                references = $column.last().text().replace(/\t/g, '').replace(/\n/g, '')
                            ;

                            if (/\d+/g.test(references)) {
                                references = references.match(/\d+/g).join(',');
                            }
                            tableContent.push([street, references]);
                        });

                        tableTitle.push([ title ]);

                        console.log(tableTitle.toString());
                        console.log(tableContent.toString());
                    });
                }
            })
        }
    });
} catch (e) {
    console.log(sprintf("\n%s\n", e));
}